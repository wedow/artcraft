use crate::core::commands::command_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus, CommandResult};
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::services::sora::events::sora_image_enqueue_failure_event::SoraImageEnqueueFailureEvent;
use crate::services::sora::events::sora_image_enqueue_success_event::SoraImageEnqueueSuccessEvent;
use crate::services::sora::state::read_sora_credentials_from_disk::read_sora_credentials_from_disk;
use crate::services::sora::state::sora_credential_holder::SoraCredentialHolder;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download::simple_http_download;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use errors::{AnyhowError, AnyhowResult};
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{DynamicImage, ImageReader};
use log::{debug, error, info, warn};
use openai_sora_client::credentials::SoraCredentials;
use openai_sora_client::creds::credential_migration::CredentialMigrationRef;
use openai_sora_client::recipes::image_remix_with_session_auto_renew::{image_remix_with_session_auto_renew, ImageRemixAutoRenewRequest};
use openai_sora_client::recipes::image_upload_from_file_with_session_auto_renew::{image_upload_from_file_with_session_auto_renew, ImageUploadFromFileAutoRenewRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use openai_sora_client::requests::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
use openai_sora_client::requests::upload::upload_media_from_bytes::sora_media_upload_from_bytes;
use openai_sora_client::requests::upload::upload_media_from_file::sora_media_upload_from_file;
use openai_sora_client::sora_error::SoraError;
use serde_derive::{Deserialize, Serialize};
use std::fs::read_to_string;
use std::io::Cursor;
use std::ops::Add;
use std::time::Duration;
use storyteller_client::api_error::ApiError;
use storyteller_client::api_error::ApiError::InternalServerError;
use storyteller_client::media_files::get_media_file::get_media_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Emitter, Manager, State};
use tokens::tokens::media_files::MediaFileToken;

const SORA_IMAGE_UPLOAD_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

const SORA_IMAGE_REMIX_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

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

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum SoraImageRemixErrorType {
  /// Generic server error
  ServerError,
  /// The user is sending too many requests
  TooManyConcurrentTasks, 
  /// User is not logged into Sora!
  SoraLoginRequired,
  /// The user needs to create a Sora account
  SoraUsernameNotYetCreated,
  /// The Sora service is having problems. Try again soon.
  SoraIsHavingProblems,
}


#[tauri::command]
pub async fn sora_image_remix_command(
  app: AppHandle,
  request: SoraImageRemixCommand,
  app_data_root: State<'_, AppDataRoot>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> CommandResult<(), SoraImageRemixErrorType, ()> {
  
  info!("image_generation_command called; scene media token: {:?}, additional images: {:?}", 
    request.snapshot_media_token, request.maybe_additional_images);

  // TODO(bt,2025-04-24): Better error messages to caller

  let has_credentials = sora_creds_manager
      .has_apparently_complete_credentials()
      .unwrap_or(true); // NB: Failures would be lock issues
  
  if !has_credentials {
    warn!("No apparently completed credentials found");
    return Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::Unauthorized,
      error_message: Some("You need to log into Sora to continue. See the settings menu.".to_string()),
      error_type: Some(SoraImageRemixErrorType::SoraLoginRequired),
      error_details: None,
    });
  }

  let result = generate_image(request, &app_data_root, &sora_creds_manager, &sora_task_queue).await;
  
  match result {
    Err(err) => {
      error!("error: {:?}", err);

      let event = SoraImageEnqueueFailureEvent {};
      let result = event.send(&app);

      if let Err(err) = result {
        error!("Failed to emit event: {:?}", err);
      }
      
      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = SoraImageRemixErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";
      
      match (err) {
        InnerError::SoraError(SoraError::TooManyConcurrentTasks) => {
          error_type = SoraImageRemixErrorType::TooManyConcurrentTasks;
          status = CommandErrorStatus::ServerError;
          error_message = "You already have work in progress. Please wait for it to finish.";
        },
        InnerError::SoraError(SoraError::SoraUsernameNotYetCreated) => {
          error_type = SoraImageRemixErrorType::SoraUsernameNotYetCreated;
          status = CommandErrorStatus::BadRequest;
          error_message = "You need to create a username on Sora.com to continue.";
        },
        InnerError::SoraError(SoraError::BadGateway(_) | SoraError::CloudFlareTimeout(_)) => {
          error_type = SoraImageRemixErrorType::SoraIsHavingProblems;
          status = CommandErrorStatus::ServerError;
          error_message = "Sora is having problems. Please wait a moment and then retry.";
        }
        _ => {},
      }

      Err(CommandErrorResponseWrapper {
        status,
        error_message: Some(error_message.to_string()),
        error_type: Some(error_type),
        error_details: None,
      })
    }
    Ok(_) => {
      let event = SoraImageEnqueueSuccessEvent {};
      let result = event.send(&app);

      if let Err(err) = result {
        error!("Failed to emit event: {:?}", err);
      }

      Ok(().into())
    }
  }
}

#[derive(Debug)]
enum InnerError {
  SoraError(SoraError),
  AnyhowError(AnyhowError),
  StorytellerApiError(ApiError),
}

impl From<AnyhowError> for InnerError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<SoraError> for InnerError {
  fn from(value: SoraError) -> Self {
    Self::SoraError(value)
  }
}

impl From<ApiError> for InnerError {
  fn from(value: ApiError) -> Self {
    Self::StorytellerApiError(value)
  }
}

pub async fn generate_image(
  request: SoraImageRemixCommand,
  app_data_root: &AppDataRoot,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<(), InnerError> {

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
          request_timeout: Some(SORA_IMAGE_UPLOAD_TIMEOUT),
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
        request_timeout: Some(SORA_IMAGE_REMIX_TIMEOUT),
      }).await?;

  if let Some(new_creds) = maybe_new_creds {
    info!("Storing updated credentials.");
    sora_creds_manager.set_credentials(&new_creds)?;
  }

  info!("New Sora Task ID: {:?} ", response.task_id);

  sora_task_queue.insert(&response.task_id)?;

  Ok(())
}
