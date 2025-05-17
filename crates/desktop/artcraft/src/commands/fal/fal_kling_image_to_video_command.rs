use crate::commands::command_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus, CommandResult, SerializeMarker};
use crate::events::sendable_event_trait::SendableEvent;
use crate::events::sora::sora_image_enqueue_failure_event::SoraImageEnqueueFailureEvent;
use crate::events::sora::sora_image_enqueue_success_event::SoraImageEnqueueSuccessEvent;
use crate::state::data_dir::app_data_root::AppDataRoot;
use crate::state::data_dir::trait_data_subdir::DataSubdir;
use crate::state::fal::fal_credential_manager::FalCredentialManager;
use crate::state::sora::read_sora_credentials_from_disk::read_sora_credentials_from_disk;
use crate::state::sora::sora_credential_holder::SoraCredentialHolder;
use crate::state::sora::sora_credential_manager::SoraCredentialManager;
use crate::state::sora::sora_task_queue::SoraTaskQueue;
use crate::state::storyteller::storyteller_credential_manager::StorytellerCredentialManager;
use crate::utils::get_url_file_extension::get_url_file_extension;
use crate::utils::simple_http_download::simple_http_download;
use crate::utils::simple_http_download_to_tempfile::simple_http_download_to_tempfile;
use anyhow::anyhow;
use base64::prelude::BASE64_STANDARD;
use base64::{DecodeError, Engine};
use errors::{AnyhowError, AnyhowResult};
use fal_client::fal_error_plus::FalErrorPlus;
use fal_client::requests::remove_background_rembg::remove_background_rembg;
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
use storyteller_client::api_error::ApiError;
use storyteller_client::api_error::ApiError::InternalServerError;
use storyteller_client::media_files::get_media_file::{get_media_file, GetMediaFileSuccessResponse};
use storyteller_client::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Emitter, Manager, State};
use tempfile::NamedTempFile;
use fal_client::requests::enqueue_kling_16_image_to_video::{enqueue_kling_16_image_to_video, Kling16Args, Kling16Duration};
use filesys::file_read_bytes::file_read_bytes;
use tokens::tokens::media_files::MediaFileToken;
use crate::state::fal::fal_task_queue::FalTaskQueue;

#[derive(Deserialize)]
pub struct FalKlingImageToVideoRequest {
  /// Image media file; the image to remove the background from.
  pub image_media_token: Option<MediaFileToken>,

  /// Base64-encoded image
  pub base64_image: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum SoraImageRemixErrorType {
  /// Generic server error
  ServerError,
  /// No Fal API key available
  NeedsFalApiKey,
}


#[tauri::command]
pub async fn fal_kling_image_to_video_command(
  request: FalKlingImageToVideoRequest,
  app_data_root: State<'_, AppDataRoot>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
) -> CommandResult<(), SoraImageRemixErrorType, ()> {

  info!("fal_kling_image_to_video_command called; image media token: {:?}", request.image_media_token);

  let has_credentials = fal_creds_manager
      .has_apparent_api_token()
      .unwrap_or(true); // NB: Failures would be lock issues

  if !has_credentials {
    warn!("No API key found");
    return Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::Unauthorized,
      error_message: Some("You need to set a FAL api key".to_string()),
      error_type: Some(SoraImageRemixErrorType::NeedsFalApiKey),
      error_details: None,
    });
  }

  let result = image_to_video(
    request,
    &app_data_root,
    &fal_creds_manager,
    &storyteller_creds_manager,
    &fal_task_queue,
  ).await;
  
  if let Err(err) = result {
    error!("error: {:?}", err);

    //let event = SoraImageEnqueueFailureEvent {};
    //let result = event.send(&app);
    //if let Err(err) = result {
    //  error!("Failed to emit event: {:?}", err);
    //}

    let mut status = CommandErrorStatus::ServerError;
    let mut error_type = SoraImageRemixErrorType::ServerError;
    let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

    //match (err) {
    //  _ => {},
    //}

    return Err(CommandErrorResponseWrapper {
      status,
      error_message: Some(error_message.to_string()),
      error_type: Some(error_type),
      error_details: None,
    })
  }
  
  //let event = SoraImageEnqueueSuccessEvent {};
  //let result = event.send(&app);
  //if let Err(err) = result {
  //  error!("Failed to emit event: {:?}", err);
  //}
  
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

pub async fn image_to_video(
  request: FalKlingImageToVideoRequest,
  app_data_root: &AppDataRoot,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<(), InnerError> {

  let api_key = fal_creds_manager.get_key_required()?;
  let creds = storyteller_creds_manager.get_credentials_required()?;

  let mut temp_download;

  if let Some(media_token) = request.image_media_token {
    temp_download = download_media_file(&app_data_root, &media_token).await?;

  } else if let Some(base64_bytes) = request.base64_image {
    temp_download = persist_base64(&app_data_root, base64_bytes).await?;
  } else {
    return Err(InnerError::AnyhowError(anyhow!("No image media token or base64 image provided")));
  }

  info!("Calling FAL image to video ...");

  let filename = temp_download.path().to_path_buf();

  let enqueued = enqueue_kling_16_image_to_video(Kling16Args {
    image_path: filename,
    api_key: &api_key,
    duration: Kling16Duration::Default,
  }).await?;

  if let Err(err) = fal_task_queue.insert(&enqueued) {
    error!("Failed to enqueue task: {:?}", err);
    return Err(InnerError::AnyhowError(anyhow!("Failed to enqueue task: {:?}", err)));
  }

  Ok(())
}

async fn download_media_file(app_data_root: &AppDataRoot, token: &MediaFileToken) -> Result<NamedTempFile, InnerError> {
  let response = get_media_file(&ApiHost::Storyteller, token).await?;

  let media_file_url = &response.media_file.media_links.cdn_url;

  let extension_with_dot = get_url_file_extension(media_file_url)
      .map(|ext| format!(".{}", ext))
      .unwrap_or_else(|| ".png".to_string());

  //let filename = format!("{}{}", response.media_file.token.as_str(), extension_with_dot);
  //let filename = app_data_root.downloads_dir().path().join(&filename);

  let mut file = app_data_root.temp_dir().new_named_temp_file_with_extension(&extension_with_dot)?;

  simple_http_download_to_tempfile(&media_file_url, &mut file).await?;

  Ok(file) // NB: Must return TempFile to not drop / delete it
}

async fn persist_base64(app_data_root: &AppDataRoot, base64_image: String) -> Result<NamedTempFile, InnerError> {
  let bytes = BASE64_STANDARD.decode(base64_image)?;

  let extension = MimetypeInfo::get_for_bytes(&bytes)
      .map(|info| info.file_extension())
      .flatten()
      .map(|ext| ext.extension_with_period().to_string())
      .unwrap_or_else(|| ".png".to_string());

  let mut file = app_data_root.temp_dir().new_named_temp_file_with_extension(&extension)?;

  file.write_all(bytes.as_ref())?;

  Ok(file) // NB: Must return TempFile to not drop / delete it
}
