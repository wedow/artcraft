use crate::state::data_dir::app_data_root::AppDataRoot;
use crate::state::data_dir::trait_data_subdir::DataSubdir;
use crate::state::sora::read_sora_credentials_from_disk::read_sora_credentials_from_disk;
use crate::state::sora::sora_credential_holder::SoraCredentialHolder;
use crate::state::sora::sora_credential_manager::SoraCredentialManager;
use crate::state::sora::sora_task_queue::SoraTaskQueue;
use crate::utils::get_url_file_extension::get_url_file_extension;
use crate::utils::simple_http_download::simple_http_download;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use errors::AnyhowResult;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{DynamicImage, ImageReader};
use log::{debug, error, info};
use openai_sora_client::credentials::SoraCredentials;
use openai_sora_client::creds::credential_migration::CredentialMigrationRef;
use openai_sora_client::recipes::image_remix_with_session_auto_renew::{image_remix_with_session_auto_renew, ImageRemixAutoRenewRequest};
use openai_sora_client::recipes::image_upload_from_file_with_session_auto_renew::{image_upload_from_file_with_session_auto_renew, ImageUploadFromFileAutoRenewRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use openai_sora_client::requests::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
use openai_sora_client::requests::upload::upload_media_from_bytes::sora_media_upload_from_bytes;
use openai_sora_client::requests::upload::upload_media_from_file::sora_media_upload_from_file;
use serde_derive::{Deserialize, Serialize};
use std::fs::read_to_string;
use std::io::Cursor;
use storyteller_client::media_files::get_media_file::get_media_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Emitter, Manager, State};
use tokens::tokens::media_files::MediaFileToken;
use crate::threads::sora_task_polling_thread::SoraImageGenerationComplete;

#[derive(Debug, Clone, Serialize)]
pub struct SoraImageEnqueueFailure {
  // TODO: Reason.
}

#[derive(Debug, Clone, Serialize)]
pub struct SoraImageEnqueueSuccess {
}

#[derive(Deserialize)]
pub struct SoraImageRemixCommand {
  /// Image media file; the engine or canvas snapshot (screenshot).
  pub snapshot_media_token: MediaFileToken,

  /// The user's image generation prompt.
  pub prompt: String,

  /// Turn off the system prompt.
  pub disable_system_prompt: Option<bool>,

  /// Additional images to include (optional). Up to nine images.
  pub maybe_additional_images: Option<Vec<MediaFileToken>>,

  pub maybe_number_of_samples: Option<u32>,
}

#[tauri::command]
pub async fn sora_image_remix_command(
  app: AppHandle,
  request: SoraImageRemixCommand,
  app_data_root: State<'_, AppDataRoot>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Result<String, String> {
  
  info!("image_generation_command called; scene media token: {:?}, additional images: {:?}", 
    request.snapshot_media_token, request.maybe_additional_images);

  // TODO(bt,2025-04-24): Better error messages to caller

  let result = generate_image(request, &app_data_root, &sora_creds_manager, &sora_task_queue).await;
  
  if let Err(err) = result {
    error!("error: {:?}", err);

    let result = app.emit("sora-image-enqueue-failure", SoraImageEnqueueFailure{});
    if let Err(err) = result {
      error!("Failed to emit event: {:?}", err);
    }
    
    return Err("there was an error".to_string());
  }

  let result = app.emit("sora-image-enqueue-success", SoraImageEnqueueSuccess{});
  if let Err(err) = result {
    error!("Failed to emit event: {:?}", err);
  }

  Ok("success".to_string())
}

pub async fn generate_image(
  request: SoraImageRemixCommand,
  app_data_root: &AppDataRoot,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> AnyhowResult<()> {

  let response = get_media_file(&ApiHost::Storyteller, &request.snapshot_media_token).await?;

  let media_file_url = &response.media_file.media_links.cdn_url;
  let extension_with_dot = get_url_file_extension(media_file_url)
      .map(|ext| format!(".{}", ext))
      .unwrap_or_else(|| ".png".to_string());

  let filename = format!("{}{}", response.media_file.token.as_str(), extension_with_dot);
  let filename = app_data_root.downloads_dir().path().join(&filename);

  simple_http_download(&media_file_url, &filename).await?;

  let files_to_upload = vec![filename];

  let mut creds = sora_creds_manager.get_credentials_required()?;

  let credential_updated = maybe_upgrade_or_renew_session(&mut creds)
      .await
      .map_err(|err| {
        error!("Failed to upgrade or renew session: {:?}", err);
        err
      })?;

  if credential_updated {
    info!("Storing updated credentials");
    sora_creds_manager.set_credentials(&creds)?;
  }

  let mut sora_media_tokens = Vec::with_capacity(files_to_upload.len());

  for (i, file_path) in files_to_upload.iter().enumerate() {
    info!("Uploading image {} of {}...", (i+1), files_to_upload.len());

    let (response, maybe_new_credentials) =
        image_upload_from_file_with_session_auto_renew(ImageUploadFromFileAutoRenewRequest {
          file_path,
          credentials: &creds,
        }).await?;

    if let Some(new_creds) = maybe_new_credentials {
      info!("Storing updated credentials.");
      sora_creds_manager.set_credentials(&new_creds)?;
      creds = new_creds;
    }

    sora_media_tokens.push(response.id);
  }

  info!("Calling image generation...");

  // TODO(bt,2025-04-21): Download media tokens.
  //  Note: This is incredibly inefficient. We should keep a local cache.
  //  Also, if they've already been uploaded to OpenAI, we shouldn't continue to re-upload.

  let (response, maybe_new_creds) =
      image_remix_with_session_auto_renew(ImageRemixAutoRenewRequest {
        prompt: request.prompt.to_string(),
        num_images: NumImages::One,
        image_size: ImageSize::Square,
        sora_media_tokens: sora_media_tokens.clone(),
        credentials: &creds,
      }).await?;

  if let Some(new_creds) = maybe_new_creds {
    info!("Storing updated credentials.");
    sora_creds_manager.set_credentials(&new_creds)?;
  }

  info!("New Sora Task ID: {:?} ", response.task_id);

  sora_task_queue.insert(&response.task_id)?;

  Ok(())
}
