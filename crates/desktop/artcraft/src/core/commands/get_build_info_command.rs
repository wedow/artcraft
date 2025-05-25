use crate::core::state::os_platform::OsPlatform;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageReader;
use log::info;
use serde_derive::Serialize;
use std::io::Cursor;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize)]
pub struct BuildInfoResponse {
  pub build_timestamp: DateTime<Utc>,
  pub git_commit_id: Option<String>,
  pub git_commit_short_id: Option<String>,
  pub git_commit_short_timestamp: Option<DateTime<Utc>>,
}

#[tauri::command]
pub fn get_build_info_command() -> Result<BuildInfoResponse, String> {
  info!("get_build_info_command called...");
  
  let build_timestamp = build_metadata::build_timestamp();
  let git_commit_id = build_metadata::git_commit_id();
  let git_commit_short_id = build_metadata::git_commit_short_id();
  let git_commit_short_timestamp = build_metadata::git_commit_timestamp();

  Ok(BuildInfoResponse {
    build_timestamp,
    git_commit_id: git_commit_id.map(|s| s.to_string()),
    git_commit_short_id: git_commit_short_id.map(|s| s.to_string()),
    git_commit_short_timestamp,
  })
}

