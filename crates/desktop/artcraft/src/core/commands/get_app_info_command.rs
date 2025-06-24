use crate::core::commands::response::shorthand::InfallibleResponse;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::os_platform::OsPlatform;
use crate::services::fal::commands::fal_background_removal_command::FalBackgroundRemovalSuccessResponse;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use chrono::{DateTime, Utc};
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageReader;
use log::info;
use serde_derive::Serialize;
use std::io::Cursor;
use tauri::State;

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
pub fn get_app_info_command(
  app_env_configs: State<'_, AppEnvConfigs>,
) -> InfallibleResponse<AppInfoResponse> {
  info!("get_app_info_command called...");
  
  let build_timestamp = build_metadata::build_timestamp();
  let git_commit_id = build_metadata::git_commit_id();
  let git_commit_short_id = build_metadata::git_commit_short_id();
  let git_commit_timestamp = build_metadata::git_commit_timestamp();

  let storyteller_host = app_env_configs.storyteller_host.to_api_hostname();

  AppInfoResponse {
    build_timestamp,
    git_commit_id: git_commit_id.map(|s| s.to_string()),
    git_commit_short_id: git_commit_short_id.map(|s| s.to_string()),
    git_commit_timestamp,
    storyteller_host,
  }.into()
}

