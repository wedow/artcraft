use crate::core::commands::enqueue::video::handle_video_artcraft::handle_video_artcraft;
use crate::core::commands::enqueue::video::handle_video_fal::handle_video_fal;
use crate::core::commands::enqueue::video::internal_video_error::InternalVideoError;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::model::video_models::VideoModel;
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
use tokens::tokens::media_files::MediaFileToken;
use crate::core::commands::enqueue::object::enqueue_image_to_3d_object_command::EnqueueImageTo3dObjectErrorType;
use crate::core::commands::enqueue::object::internal_object_error::InternalObjectError;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};

#[derive(Deserialize)]
pub struct EnqueueImageToVideoRequest {
  /// Image media file; the image to remove the background from.
  /// TODO: In the future we may support base64 images, URLs, or file paths here.
  pub image_media_token: Option<MediaFileToken>,
  
  /// The model to use.
  pub model: Option<VideoModel>,
}

#[derive(Serialize)]
pub struct EnqueueImageToVideoSuccessResponse {
}

impl SerializeMarker for EnqueueImageToVideoSuccessResponse {}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueImageToVideoErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,
  /// No model available for video generation
  NoProviderAvailable,
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
pub async fn enqueue_image_to_video_command(
  app: AppHandle,
  request: EnqueueImageToVideoRequest,
  app_data_root: State<'_, AppDataRoot>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<EnqueueImageToVideoSuccessResponse, EnqueueImageToVideoErrorType, ()> {

  info!("enqueue_image_to_video_command called");

  let result = handle_request(
    &app,
    request,
    &app_data_root,
    &provider_priority_store,
    &fal_creds_manager,
    &storyteller_creds_manager,
    &fal_task_queue,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = EnqueueImageToVideoErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        InternalVideoError::NoModelSpecified => {
          status = CommandErrorStatus::BadRequest;
          error_type = EnqueueImageToVideoErrorType::ModelNotSpecified;
          error_message = "No model specified for video generation";
        }
        InternalVideoError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = EnqueueImageToVideoErrorType::NoProviderAvailable;
          error_message = "No configured provider available for video generation";
        }
        InternalVideoError::NeedsFalApiKey => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueImageToVideoErrorType::NeedsFalApiKey;
          error_message = "You need to set a FAL api key";
        },
        InternalVideoError::NeedsStorytellerCredentials => {
          status = CommandErrorStatus::Unauthorized;
          error_type = EnqueueImageToVideoErrorType::NeedsStorytellerCredentials;
          error_message = "You need to be logged into Artcraft.";
        }
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
      Ok(EnqueueImageToVideoSuccessResponse {}.into())
    }
  }
}


pub async fn handle_request(
  app: &AppHandle,
  request: EnqueueImageToVideoRequest,
  app_data_root: &AppDataRoot,
  provider_priority_store: &ProviderPriorityStore,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<(), InternalVideoError> {

  let priority = provider_priority_store.get_priority()?;
  
  for provider in priority.iter() {
    match provider {
      Provider::Sora => {} // Fallthrough
      Provider::Artcraft => {
        return Ok(handle_video_artcraft(
          request, &app, app_data_root, storyteller_creds_manager).await?);
      }
      Provider::Fal => {
        if fal_creds_manager.has_apparent_api_token()? {
          return Ok(handle_video_fal(
            &app, app_data_root, request, fal_creds_manager, fal_task_queue).await?);
        }
      }
    }
  }

  Err(InternalVideoError::NoProviderAvailable)
}
