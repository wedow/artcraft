use crate::core::commands::response::shorthand::InfallibleResponse;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use chrono::{DateTime, Utc};
use log::info;
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

#[derive(Deserialize)]
pub struct GetMediaFileRequest {
  pub token: MediaFileToken,
}

#[derive(Debug, Serialize)]
pub struct AppInfoResponse {
  pub build_timestamp: DateTime<Utc>,
  pub git_commit_id: Option<String>,
  pub git_commit_short_id: Option<String>,
  pub git_commit_timestamp: Option<DateTime<Utc>>,
  pub storyteller_host: String,
}

impl SerializeMarker for AppInfoResponse {}

#[tauri::command]
pub fn get_media_file_command(
  request: GetMediaFileRequest,
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> InfallibleResponse<AppInfoResponse> {
  info!("get_media_file_command called...");

  let build_timestamp = build_metadata::build_timestamp();
  let git_commit_id = build_metadata::git_commit_id();
  let git_commit_short_id = build_metadata::git_commit_short_id();
  let git_commit_timestamp = build_metadata::git_commit_timestamp();

  let storyteller_host = app_env_configs.storyteller_host.to_api_hostname_and_scheme();

  AppInfoResponse {
    build_timestamp,
    git_commit_id: git_commit_id.map(|s| s.to_string()),
    git_commit_short_id: git_commit_short_id.map(|s| s.to_string()),
    git_commit_timestamp,
    storyteller_host,
  }.into()
}

