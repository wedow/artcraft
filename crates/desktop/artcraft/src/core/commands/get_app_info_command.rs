use crate::core::commands::response::shorthand::InfallibleResponse;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::os_platform::OsPlatform;
use chrono::{DateTime, Utc};
use log::info;
use serde_derive::Serialize;
use tauri::State;
use crate::core::state::artcraft_platform_info::{ArtcraftOs, ArtcraftPlatformInfo};

#[derive(Debug, Serialize)]
pub struct AppInfoResponse {
  pub artcraft_version: String,

  pub build_timestamp: DateTime<Utc>,

  pub git_commit_id: Option<String>,
  pub git_commit_short_id: Option<String>,
  pub git_commit_timestamp: Option<DateTime<Utc>>,

  pub os_platform: DetectedOs,
  pub os_version: String,

  pub storyteller_host: String,
}

impl SerializeMarker for AppInfoResponse {}

#[derive(Copy, Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DetectedOs {
  Windows,
  #[serde(rename = "macos")]
  MacOS,
  Linux,
  Unknown,
}

#[tauri::command]
pub fn get_app_info_command(
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_platform_info: State<'_, ArtcraftPlatformInfo>,
) -> InfallibleResponse<AppInfoResponse> {
  info!("get_app_info_command called...");
  
  let storyteller_host = app_env_configs.storyteller_host.to_api_hostname_and_scheme();

  let os_platform = match artcraft_platform_info.os_platform {
    ArtcraftOs::Linux => DetectedOs::Linux,
    ArtcraftOs::MacOS => DetectedOs::MacOS,
    ArtcraftOs::Windows => DetectedOs::Windows,
    ArtcraftOs::Unknown => DetectedOs::Unknown,
  };

  AppInfoResponse {
    artcraft_version: artcraft_platform_info.artcraft_version.clone(),
    build_timestamp: artcraft_platform_info.build_timestamp,
    git_commit_id: artcraft_platform_info.git_commit_id.clone(),
    git_commit_short_id: artcraft_platform_info.git_commit_short_id.clone(),
    git_commit_timestamp: artcraft_platform_info.git_commit_timestamp,
    os_platform,
    os_version: artcraft_platform_info.os_version.clone(),
    storyteller_host,
  }.into()
}

