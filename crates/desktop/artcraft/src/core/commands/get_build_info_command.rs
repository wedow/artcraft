use crate::core::commands::command_response_wrapper::{CommandResult, InfallibleResponse, SerializeMarker};
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

#[derive(Debug, Serialize)]
pub struct BuildInfoResponse {
  pub build_timestamp: DateTime<Utc>,
  pub git_commit_id: Option<String>,
  pub git_commit_short_id: Option<String>,
  pub git_commit_timestamp: Option<DateTime<Utc>>,
}

impl SerializeMarker for BuildInfoResponse {}

#[tauri::command]
pub fn get_build_info_command() -> InfallibleResponse<BuildInfoResponse> {
  info!("get_build_info_command called...");
  
  let build_timestamp = build_metadata::build_timestamp();
  let git_commit_id = build_metadata::git_commit_id();
  let git_commit_short_id = build_metadata::git_commit_short_id();
  let git_commit_timestamp = build_metadata::git_commit_timestamp();

  BuildInfoResponse {
    build_timestamp,
    git_commit_id: git_commit_id.map(|s| s.to_string()),
    git_commit_short_id: git_commit_short_id.map(|s| s.to_string()),
    git_commit_timestamp,
  }.into()
}

