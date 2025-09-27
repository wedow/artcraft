use serde_derive::{Deserialize, Serialize};
use tokens::tokens::app_session::AppSessionToken;
use utoipa::ToSchema;

pub const LOG_ACTIVE_USER_PATH: &str = "/v1/analytics/active_user";

#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct LogAppActiveUserRequest {
  /// Clientside-generated session token.
  /// If present, it'll be validated against an expected format.
  pub maybe_app_session_token: Option<AppSessionToken>,
  
  /// An override for the application platform/OS (windows, mac, linux).
  pub maybe_os_platform: Option<String>,

  /// An override for the version of the OS (e.g. 10.15.7, 11, 22.04).
  pub maybe_os_version: Option<String>,

  /// An override for the application name.
  /// If set together with `maybe_app_version`, the two will be 
  /// concatenated as `{maybe_app_name}/{maybe_app_version}`.
  pub maybe_app_name: Option<String>,

  /// An override for the application version.
  /// If set together with `maybe_app_name`, the two will be 
  /// concatenated as `{maybe_app_name}/{maybe_app_version}`.
  pub maybe_app_version: Option<String>,
  
  /// How long the user has been active in the app, in seconds.
  pub maybe_session_duration_seconds: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct LogAppActiveUserResponse {
  pub success: bool,
  
  /// How long to wait until the next analytics event, in milliseconds.
  /// The client should honor this and is free to add jitter.
  pub wait_for_retry_millis: u64,
}
