use crate::core::commands::command_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus, CommandResult, SerializeMarker};
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::utils::download_media_file_to_temp_dir::download_media_file_to_temp_dir;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::save_base64_image_to_temp_dir::save_base64_image_to_temp_dir;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::core::utils::simple_http_download_to_tempfile::simple_http_download_to_tempfile;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::sora::events::sora_image_enqueue_failure_event::SoraImageEnqueueFailureEvent;
use crate::services::sora::events::sora_image_enqueue_success_event::SoraImageEnqueueSuccessEvent;
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
use fal_client::requests::image_gen::enqueue_flux_pro_ultra_text_to_image::{enqueue_flux_pro_ultra_text_to_image, FluxProUltraTextToImageArgs};
use fal_client::requests::image_gen::enqueue_recraft3_text_to_image::{enqueue_recraft3_text_to_image, Recraft3TextToImageArgs};
use fal_client::requests::remove_background_rembg::remove_background_rembg;
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
use crate::services::fal::state::fal_task_queue::FalTaskQueue;

#[derive(Deserialize)]
pub struct EnqueueTextToImageRequest {
  /// Text prompt for the image generation. Required.
  pub prompt: Option<String>,

  /// The model to use.
  pub model: Option<EnqueueTextToImageModel>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueTextToImageModel {
  #[serde(rename = "flux_pro_ultra")]
  FluxProUltra,
  #[serde(rename = "recraft_3")]
  Recraft3,
}

#[derive(Serialize)]
pub struct EnqueueTextToImageSuccessResponse {
}

impl SerializeMarker for EnqueueTextToImageSuccessResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueTextToImageErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,
  /// Generic server error
  ServerError,
  /// No Fal API key available
  NeedsFalApiKey,
  /// Fal had an API error
  FalError,
}


#[tauri::command]
pub async fn enqueue_text_to_image_command(
  request: EnqueueTextToImageRequest,
  app_data_root: State<'_, AppDataRoot>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
) -> CommandResult<EnqueueTextToImageSuccessResponse, EnqueueTextToImageErrorType, ()> {

  info!("enqueue_text_to_image called");

  let result = handle_request(
    request,
    &app_data_root,
    &fal_creds_manager,
    &storyteller_creds_manager,
    &fal_task_queue,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);

      //let event = SoraImageEnqueueFailureEvent {};
      //let result = event.send(&app);
      //if let Err(err) = result {
      //  error!("Failed to emit event: {:?}", err);
      //}

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = EnqueueTextToImageErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        InnerError::NoModelSpecified => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueTextToImageErrorType::ModelNotSpecified;
          error_message = "No model specified for image generation";
        }
        InnerError::NeedsFalApiKey => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueTextToImageErrorType::NeedsFalApiKey;
          error_message = "You need to set a FAL api key";
        },
        _ => {}, // Fall-through
      }

      Err(CommandErrorResponseWrapper {
        status,
        error_message: Some(error_message.to_string()),
        error_type: Some(error_type),
        error_details: None,
      })
    }
    Ok(result) => {
      //let event = SoraImageEnqueueSuccessEvent {};
      //let result = event.send(&app);
      //if let Err(err) = result {
      //  error!("Failed to emit event: {:?}", err);
      //}

      Ok(EnqueueTextToImageSuccessResponse {
      }.into())
    }
  }
}

#[derive(Debug)]
enum InnerError {
  NoModelSpecified,
  NeedsFalApiKey,
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

pub async fn handle_request(
  request: EnqueueTextToImageRequest,
  app_data_root: &AppDataRoot,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<(), InnerError> {

  match request.model {
    None => {
      return Err(InnerError::NoModelSpecified);
    }
    Some(_) => {}
  }
  
  let has_credentials = fal_creds_manager
      .has_apparent_api_token()
      .unwrap_or(true); // NB: Failures would be lock issues

  if !has_credentials {
    warn!("No FAL API key found");
    return Err(InnerError::NeedsFalApiKey);
  }

  let api_key = fal_creds_manager.get_key_required()?;
  let prompt = request.prompt.as_deref().unwrap_or("");

  let result = match request.model {
    None => {
      return Err(InnerError::NoModelSpecified);
    }
    Some(EnqueueTextToImageModel::FluxProUltra) => {
      info!("enqueue Flux Pro Ultra text-to-image with prompt: {}", prompt);
      enqueue_flux_pro_ultra_text_to_image(FluxProUltraTextToImageArgs {
        prompt,
        api_key: &api_key,
      }).await
    }
    Some(EnqueueTextToImageModel::Recraft3) => {
      info!("enqueue Recraft v3 text-to-image with prompt: {}", prompt);
      enqueue_recraft3_text_to_image(Recraft3TextToImageArgs {
        prompt,
        api_key: &api_key,
      }).await
    }
  };

  match result {
    Ok(enqueued) => {
      info!("Successfully enqueued text to image");

      if let Err(err) = fal_task_queue.insert(&enqueued) {
        error!("Failed to enqueue task: {:?}", err);
        return Err(InnerError::AnyhowError(anyhow!("Failed to enqueue task: {:?}", err)));
      }
    }
    Err(err) => {
      error!("Failed to enqueue text to image: {:?}", err);
      return Err(InnerError::FalError(err));
    }
  }

  Ok(())
}

