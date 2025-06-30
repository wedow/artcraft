use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use errors::AnyhowError;
use log::{error, info, warn};
use openai_sora_client::recipes::image_remix_with_session_auto_renew::{image_remix_with_session_auto_renew, ImageRemixAutoRenewRequest};
use openai_sora_client::recipes::image_upload_from_file_with_session_auto_renew::{image_upload_from_file_with_session_auto_renew, ImageUploadFromFileAutoRenewRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use openai_sora_client::sora_error::SoraError;
use serde_derive::{Deserialize, Serialize};
use std::time::Duration;
use storyteller_client::error::storyteller_error::StorytellerError;
use storyteller_client::media_files::get_media_file::get_media_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Manager, State};
use tokens::tokens::media_files::MediaFileToken;

const SORA_IMAGE_UPLOAD_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

const SORA_IMAGE_REMIX_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

const DEFAULT_ASPECT_RATIO : SoraAspectRatio = SoraAspectRatio::Square;

#[derive(Deserialize, Debug)]
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
  
  /// Aspect ratio.
  pub aspect_ratio: Option<SoraAspectRatio>,
}

#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum SoraAspectRatio {
  Square,
  Wide,
  Tall,
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
) -> Response<(), SoraImageRemixErrorType, ()> {
  
  info!("image_generation_command called; scene media token: {:?}, additional images: {:?}, full request: {:?}", 
    &request.snapshot_media_token, &request.maybe_additional_images, &request);

  // TODO(bt,2025-04-24): Better error messages to caller

  let has_credentials = sora_creds_manager
      .has_apparently_complete_credentials()
      .unwrap_or(true); // NB: Failures would be lock issues
  
  if !has_credentials {
    warn!("No apparently completed credentials found");

    let error_message = "You need to log into Sora to continue. See the settings menu.";

    let event = GenerationEnqueueFailureEvent {
      action: GenerationAction::GenerateImage,
      service: GenerationServiceProvider::Sora,
      model: None,
      reason: Some(error_message.to_string()),
    };

    if let Err(err) = event.send(&app) {
      error!("Failed to emit event: {:?}", err); // Fail open.
    }

    return Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::Unauthorized,
      error_message: Some(error_message.to_string()),
      error_type: Some(SoraImageRemixErrorType::SoraLoginRequired),
      error_details: None,
    });
  }

  let result = generate_image(request, &app_data_root, &sora_creds_manager, &sora_task_queue).await;
  
  match result {
    Err(err) => {
      error!("Sora image remix error: {:?}", err);

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = SoraImageRemixErrorType::ServerError;
      let mut error_message = "An error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match (err) {
        InnerError::SoraError(SoraError::TooManyConcurrentTasks) => {
          error_type = SoraImageRemixErrorType::TooManyConcurrentTasks;
          status = CommandErrorStatus::ServerError;
          error_message = "You have too many Sora image generation tasks running. Please wait a moment.";
        },
        InnerError::SoraError(SoraError::SoraUsernameNotYetCreated) => {
          error_type = SoraImageRemixErrorType::SoraUsernameNotYetCreated;
          status = CommandErrorStatus::BadRequest;
          error_message = "Your Sora username is not yet created. Please visit the Sora.com website to create it first.";
        },
        InnerError::SoraError(SoraError::BadGateway(_) | SoraError::CloudFlareTimeout(_)) => {
          error_type = SoraImageRemixErrorType::SoraIsHavingProblems;
          status = CommandErrorStatus::ServerError;
          error_message = "Sora is having problems. Please try again later.";
        }
        _ => {},
      }

      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::GenerateImage,
        service: GenerationServiceProvider::Sora,
        model: None,
        reason: Some(error_message.to_string()),
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      Err(CommandErrorResponseWrapper {
        status,
        error_message: Some(error_message.to_string()),
        error_type: Some(error_type),
        error_details: None,
      })
    }
    Ok(_) => {
      let event = GenerationEnqueueSuccessEvent {
        action: GenerationAction::GenerateImage,
        service: GenerationServiceProvider::Sora,
        model: None,
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      Ok(().into())
    }
  }
}

#[derive(Debug)]
enum InnerError {
  SoraError(SoraError),
  AnyhowError(AnyhowError),
  StorytellerError(StorytellerError),
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

impl From<StorytellerError> for InnerError {
  fn from(value: StorytellerError) -> Self {
    Self::StorytellerError(value)
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

  let aspect_ratio = request.aspect_ratio.unwrap_or(DEFAULT_ASPECT_RATIO);
  
  let aspect_ratio = match aspect_ratio {
    SoraAspectRatio::Square => ImageSize::Square,
    SoraAspectRatio::Wide => ImageSize::Wide,
    SoraAspectRatio::Tall => ImageSize::Tall,
  };

  info!("Calling image generation...");

  // TODO(bt,2025-04-21): Download media tokens.
  //  Note: This is incredibly inefficient. We should keep a local cache.
  //  Also, if they've already been uploaded to OpenAI, we shouldn't continue to re-upload.

  let (response, maybe_new_creds) =
      image_remix_with_session_auto_renew(ImageRemixAutoRenewRequest {
        prompt: request.prompt.to_string(),
        num_images: NumImages::One,
        image_size: aspect_ratio,
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
