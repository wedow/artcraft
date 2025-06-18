use crate::core::commands::enqueue::image::handle_image_fal::handle_image_fal;
use crate::core::commands::enqueue::image::handle_image_sora::handle_image_sora;
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
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
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use fal_client::requests::queue::image_gen::enqueue_recraft3_text_to_image::{enqueue_recraft3_text_to_image, Recraft3TextToImageArgs};
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
use crate::core::commands::enqueue::image::handle_image_artcraft::handle_image_artcraft;
use crate::core::commands::enqueue::object::handle_object_artcraft::handle_object_artcraft;

#[derive(Deserialize)]
pub struct EnqueueTextToImageRequest {
  /// Text prompt for the image generation. Required.
  pub prompt: Option<String>,

  /// The model to use.
  pub model: Option<EnqueueTextToImageModel>,
}

#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueTextToImageModel {
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[deprecated(note="use `flux_pro_11_ultra` instead")]
  #[serde(rename = "flux_pro_ultra")]
  FluxProUltra,
  #[serde(rename = "flux_pro_11")]
  FluxPro11,
  #[serde(rename = "flux_pro_11_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
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
  /// Needs to be logged into Artcraft
  NeedsStorytellerCredentials,
}


#[tauri::command]
pub async fn enqueue_text_to_image_command(
  app: AppHandle,
  request: EnqueueTextToImageRequest,
  app_data_root: State<'_, AppDataRoot>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<EnqueueTextToImageSuccessResponse, EnqueueTextToImageErrorType, ()> {

  info!("enqueue_text_to_image called");

  let result = handle_request(
    &app,
    request,
    &app_data_root,
    &fal_creds_manager,
    &storyteller_creds_manager,
    &fal_task_queue,
    &sora_creds_manager,
    &sora_task_queue,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = EnqueueTextToImageErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        InternalImageError::NoModelSpecified => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueTextToImageErrorType::ModelNotSpecified;
          error_message = "No model specified for image generation";
        }
        InternalImageError::NeedsFalApiKey => {
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
    Ok(()) => {
      Ok(EnqueueTextToImageSuccessResponse {}.into())
    }
  }
}


pub async fn handle_request(
  app: &AppHandle,
  request: EnqueueTextToImageRequest,
  app_data_root: &AppDataRoot,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_task_queue: &FalTaskQueue,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<(), InternalImageError> {

  match request.model {
    None => {
      return Err(InternalImageError::NoModelSpecified);
    }
    Some(EnqueueTextToImageModel::GptImage1) => {
      handle_image_sora(&app, request, sora_creds_manager, sora_task_queue).await?;
      return Ok(());
    }
    _ => {
      // Fall-through
    }
  };

  if fal_creds_manager.has_apparent_api_token()? {
    handle_image_fal(&app, request, fal_creds_manager, fal_task_queue).await?;
  } else {
    handle_image_artcraft(request, &app, app_data_root, storyteller_creds_manager).await?;
  }

  Ok(())
}
