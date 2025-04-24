use crate::state::app_dir::AppDataRoot;
use crate::state::sora::read_sora_credentials_from_disk::read_sora_credentials_from_disk;
use crate::state::sora::sora_credential_holder::SoraCredentialHolder;
use crate::state::sora::sora_credential_manager::SoraCredentialManager;
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
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use openai_sora_client::requests::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
use openai_sora_client::requests::upload::upload_media_from_bytes::sora_media_upload_from_bytes;
use openai_sora_client::requests::upload::upload_media_from_file::{sora_media_upload_from_file, SoraMediaUploadRequest};
use serde_derive::Deserialize;
use std::fs::read_to_string;
use std::io::Cursor;
use storyteller_client::media_files::get_media_file::get_media_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Manager, State};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use tokens::tokens::media_files::MediaFileToken;

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
  _app: AppHandle,
  request: SoraImageRemixCommand,
  app_data_root: State<'_, AppDataRoot>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
) -> Result<String, String> {
  info!("image_generation_command called; processing image...");

  // TODO(bt,2025-04-24): Better error messages to caller

  generate_image(request, &app_data_root, &sora_creds_manager)
    .await
    .map_err(|err| {
      error!("error: {:?}", err);
      "there was an error".to_string()
    })?;

  Ok("success".to_string())
}

pub async fn generate_image(
  request: SoraImageRemixCommand,
  app_data_root: &AppDataRoot,
  sora_creds_manager: &SoraCredentialManager,
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

    // TODO(bt,2025-04-24): Handle JWT reset error.
    let sora_upload_response = sora_media_upload_from_file(file_path, CredentialMigrationRef::New(&creds))
        .await?;

    sora_media_tokens.push(sora_upload_response.id);
  }

  info!("Calling image generation...");

  // TODO(bt,2025-04-21): Download media tokens.
  //  Note: This is incredibly inefficient. We should keep a local cache.
  //  Also, if they've already been uploaded to OpenAI, we shouldn't continue to re-upload.

  let mut response = sora_image_gen_remix(SoraImageGenRemixRequest {
    prompt: request.prompt.to_string(),
    num_images: NumImages::One,
    image_size: ImageSize::Square,
    sora_media_tokens: sora_media_tokens.clone(),
    credentials: CredentialMigrationRef::New(&creds),
  }).await;

  // TODO(bt,2025-04-24): Handle state management better. Different errors imply different conditions.

  if let Err(err) = &response {
    error!("Error in generating image: {:?}", err);

    creds = sora_creds_manager.call_sentinel_refresh()
        .await
        .map_err(|err| {
          error!("Failed to refresh: {:?}", err);
          err
        })?;

    info!("Retrying request...");

    response = sora_image_gen_remix(SoraImageGenRemixRequest {
      prompt: request.prompt.to_string(),
      num_images: NumImages::One,
      image_size: ImageSize::Square,
      sora_media_tokens: sora_media_tokens.clone(),
      credentials: CredentialMigrationRef::New(&creds),
    }).await;
  }

  let response = response
      .map_err(|err| {
        error!("Failed to call Sora image generation: {:?}", err);
        err
      })?;

  println!(">> TASK ID: {:?} ", response.task_id);

  Ok(())
}
