use crate::core::commands::enqueue::image_inpaint::enqueue_image_inpaint_command::EnqueueImageInpaintSuccessResponse;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::{InfallibleResponse, ResponseOrErrorType};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::media_files::get_media_file::{GetMediaFileSuccessResponse, MediaFileInfo};
use chrono::{DateTime, Utc};
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use std::path::Path;
use storyteller_client::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use storyteller_client::media_files::get_media_file::get_media_file;
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize)]
pub struct GetMediaFileRequest {
  pub token: MediaFileToken,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum GetMediaFileErrorType {
  NotFound,
  NotAuthorized,
  ServerError,
}

#[derive(Debug, Serialize)]
pub struct GetMediaFileResponse {
  pub success: bool,
  pub media_file: MediaFileInfo,
}

impl SerializeMarker for GetMediaFileResponse {}

#[tauri::command]
pub async fn get_media_file_command(
  request: GetMediaFileRequest,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> ResponseOrErrorType<GetMediaFileResponse, GetMediaFileErrorType > {
  info!("get_media_file_command called...");

  let downloads = app_data_root.downloads_dir();
  let media_file_cache_path = downloads.media_file_json_path(&request.token);

  let maybe_cache = load_cache_media_file(&media_file_cache_path).await;

  if let Ok(Some(media_file_info)) = maybe_cache {
    info!("Loaded media file from cache: {:?}", media_file_info);
    return Ok(GetMediaFileResponse {
      success: true,
      media_file: media_file_info,
    }.into());
  }

  let result = query_media_file(
    request,
    &app_env_configs,
  ).await?;


  info!("Received media file from server: {:?}", result.media_file.token);

  // Save the media file to cache
  let write_result = serde_json::to_string(&result.media_file);

  match write_result {
    Err(err) => {
      error!("Failed to serialize media file to JSON: {:?}", err);
    }
    Ok(json_string) => {
      if let Err(err) = std::fs::write(&media_file_cache_path, json_string) {
        error!("Failed to write media file cache: {:?}", err);
      } else {
        info!("Media file cache written successfully to {:?}", media_file_cache_path);
      }
    },
  }

  Ok(GetMediaFileResponse {
    success: true,
    media_file: result.media_file
  }.into())
}

async fn query_media_file(
  request: GetMediaFileRequest,
  app_env_configs: &AppEnvConfigs,
) -> Result<GetMediaFileSuccessResponse, CommandErrorResponseWrapper<GetMediaFileErrorType, ()>> {

  // TODO(bt,2025-08-08): Include credentials

  let result = get_media_file(
    &app_env_configs.storyteller_host,
    //Some(&creds),
    &request.token,
  ).await;

  // TODO(bt,2025-08-08): Handle errors properly

  let result = match result {
    Ok(result) => result,
    Err(err) => {
      error!("Failed to get media file: {:?}", err);
      return Err(CommandErrorResponseWrapper {
        status: CommandErrorStatus::ServerError,
        error_message: None,
        error_type: Some(GetMediaFileErrorType::ServerError),
        error_details: None,
      });
    }
  };

  Ok(result)
}

async fn load_cache_media_file(
  path: &Path,
) -> AnyhowResult<Option<MediaFileInfo>> {
  if !path.exists() || !path.is_file() {
    return Ok(None);
  }

  let file_content = std::fs::read_to_string(path)
    .map_err(|err| {
      error!("Failed to read media file cache: {:?}", err);
      err
    })?;

  let media_file_info : MediaFileInfo = serde_json::from_str(&file_content)
      .map_err(|err| {
        error!("Failed to deserialize media file cache: {:?}", err);
        err
      })?;

  Ok(Some(media_file_info))
}

