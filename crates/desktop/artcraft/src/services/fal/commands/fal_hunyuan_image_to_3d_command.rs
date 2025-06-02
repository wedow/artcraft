use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::utils::download_media_file_to_temp_dir::download_media_file_to_temp_dir;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::save_base64_image_to_temp_dir::save_base64_image_to_temp_dir;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::core::utils::simple_http_download_to_tempfile::simple_http_download_to_tempfile;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::read_sora_credentials_from_disk::read_sora_credentials_from_disk;
use crate::services::sora::state::sora_credential_holder::SoraCredentialHolder;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use base64::prelude::BASE64_STANDARD;
use base64::{DecodeError, Engine};
use errors::{AnyhowError, AnyhowResult};
use fal_client::error::fal_error_plus::FalErrorPlus;
use fal_client::requests::queue::enqueue_hunyuan2_image_to_3d::{enqueue_hunyuan2_image_to_3d, Hunyuan2Args};
use filesys::file_read_bytes::file_read_bytes;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{DynamicImage, EncodableLayout, ImageReader};
use log::{debug, error, info, warn};
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;
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
use reqwest::Url;
use serde_derive::{Deserialize, Serialize};
use std::fs::read_to_string;
use std::io::{Cursor, Read, Write};
use std::ops::Add;
use std::path::PathBuf;
use std::time::Duration;
use storyteller_client::error::api_error::ApiError;
use storyteller_client::error::api_error::ApiError::InternalServerError;
use storyteller_client::media_files::get_media_file::{get_media_file, GetMediaFileSuccessResponse};
use storyteller_client::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Emitter, Manager, State};
use tempfile::NamedTempFile;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize)]
pub struct FalHunyuanImageTo3dRequest {
  /// Image media file; the image to remove the background from.
  pub image_media_token: Option<MediaFileToken>,

  /// Base64-encoded image
  pub base64_image: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum HunyuanErrorType {
  /// Generic server error
  ServerError,
  /// No Fal API key available
  NeedsFalApiKey,
}


#[tauri::command]
pub async fn fal_hunyuan_image_to_3d_command(
  app: AppHandle,
  request: FalHunyuanImageTo3dRequest,
  app_data_root: State<'_, AppDataRoot>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
) -> Response<(), HunyuanErrorType, ()> {

  info!("fal_hunyuan_image_to_3d_command called; image media token: {:?}", request.image_media_token);

  let has_credentials = fal_creds_manager
      .has_apparent_api_token()
      .unwrap_or(true); // NB: Failures would be lock issues

  if !has_credentials {
    warn!("No API key found");
    return Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::Unauthorized,
      error_message: Some("You need to set a FAL api key".to_string()),
      error_type: Some(HunyuanErrorType::NeedsFalApiKey),
      error_details: None,
    });
  }

  let result = image_to_3d(
    request,
    &app_data_root,
    &fal_creds_manager,
    &storyteller_creds_manager,
    &fal_task_queue,
  ).await;
  
  if let Err(err) = result {
    error!("error: {:?}", err);

    let event = GenerationEnqueueFailureEvent {
      action: GenerationAction::ImageTo3d,
      service: GenerationServiceProvider::Fal,
      model: None,
      reason: None,
    };

    if let Err(err) = event.send(&app) {
      error!("Failed to emit event: {:?}", err); // Fail open.
    }

    let mut status = CommandErrorStatus::ServerError;
    let mut error_type = HunyuanErrorType::ServerError;
    let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

    return Err(CommandErrorResponseWrapper {
      status,
      error_message: Some(error_message.to_string()),
      error_type: Some(error_type),
      error_details: None,
    })
  }

  let event = GenerationEnqueueSuccessEvent {
    action: GenerationAction::ImageTo3d,
    service: GenerationServiceProvider::Fal,
    model: None,
  };

  if let Err(err) = event.send(&app) {
    error!("Failed to emit event: {:?}", err); // Fail open.
  }

  Ok(().into())
}

#[derive(Debug)]
enum InnerError {
  FalError(FalErrorPlus),
  AnyhowError(AnyhowError),
  StorytellerApiError(ApiError),
  DecodeError(DecodeError),
  IoError(std::io::Error),
}

impl From<AnyhowError> for InnerError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<FalErrorPlus> for InnerError {
  fn from(value: FalErrorPlus) -> Self {
    Self::FalError(value)
  }
}

impl From<ApiError> for InnerError {
  fn from(value: ApiError) -> Self {
    Self::StorytellerApiError(value)
  }
}

impl From<DecodeError> for InnerError {
  fn from(value: DecodeError) -> Self {
    Self::DecodeError(value)
  }
}

impl From<std::io::Error> for InnerError {
  fn from(value: std::io::Error) -> Self {
    Self::IoError(value)
  }
}

pub async fn image_to_3d(
  request: FalHunyuanImageTo3dRequest,
  app_data_root: &AppDataRoot,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<(), InnerError> {

  let api_key = fal_creds_manager.get_key_required()?;
  let creds = storyteller_creds_manager.get_credentials_required()?;

  let mut temp_download;

  if let Some(media_token) = request.image_media_token {
    temp_download = download_media_file_to_temp_dir(&app_data_root, &media_token).await?;

  } else if let Some(base64_bytes) = request.base64_image {
    temp_download = save_base64_image_to_temp_dir(&app_data_root, base64_bytes).await?;
  } else {
    return Err(InnerError::AnyhowError(anyhow!("No image media token or base64 image provided")));
  }

  info!("Calling FAL image to 3d ...");

  let filename = temp_download.path().to_path_buf();

  let enqueued = enqueue_hunyuan2_image_to_3d(Hunyuan2Args {
    image_path: filename,
    api_key: &api_key,
  }).await?;

  if let Err(err) = fal_task_queue.insert(&enqueued) {
    error!("Failed to enqueue task: {:?}", err);
    return Err(InnerError::AnyhowError(anyhow!("Failed to enqueue task: {:?}", err)));
  }

  Ok(())
}
