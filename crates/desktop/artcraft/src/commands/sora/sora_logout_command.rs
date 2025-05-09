use crate::commands::app_preferences::get_app_preferences_command::AppPreferencesPayload;
use crate::commands::command_response_wrapper::{CommandResult, CommandSuccessResponseWrapper};
use crate::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::state::data_dir::app_data_root::AppDataRoot;
use crate::state::sora::sora_credential_manager::SoraCredentialManager;
use crate::windows::sora_login_window::open_sora_login_window::open_sora_login_window;
use errors::{AnyhowError, AnyhowResult};
use log::{error, info};
use once_cell::sync::Lazy;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::list_media::list_media::list_media;
use serde_derive::Serialize;
use std::fmt::format;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn sora_logout_command(
  sora_creds_manager: State<'_, SoraCredentialManager>,
) -> CommandResult<(), String> {
  info!("sora_logout_command called");

  if let Err(err) = sora_creds_manager.purge_credentials_from_disk() {
    error!("Error purging credentials from disk: {:?}", err);
    return Err("error purging credentials from disk".into());
  }
  
  if let Err(err) = sora_creds_manager.clear_credentials() {
    error!("Error clearing credentials from memory: {:?}", err);
    return Err("error clearing credentials from memory".into());
  }
  
  Ok(().into())
}

