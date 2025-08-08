use crate::core::commands::enqueue::image_inpaint::enqueue_image_inpaint_command::EnqueueImageInpaintSuccessResponse;
use crate::core::commands::response::shorthand::{InfallibleResponse, ResponseOrErrorType};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::media_files::get_media_file::MediaFileInfo;
use chrono::{DateTime, Utc};
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use storyteller_client::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use storyteller_client::media_files::get_media_file::get_media_file;
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};

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
  app_env_configs: State<'_, AppEnvConfigs>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> ResponseOrErrorType<GetMediaFileResponse, GetMediaFileErrorType > {
  info!("get_media_file_command called...");

  let result = get_media_file(
    &app_env_configs.storyteller_host,
    //Some(&creds),
    &request.token,
  ).await;

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

  Ok(GetMediaFileResponse {
    success: true,
    media_file: result.media_file
  }.into())
}
