use crate::commands::command_response_wrapper::{CommandResult, SerializeMarker};
use crate::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use crate::state::data_dir::app_data_root::AppDataRoot;
use crate::state::fal::fal_credential_manager::FalCredentialManager;
use anyhow::anyhow;
use errors::AnyhowResult;
use fal_client::creds::fal_api_key::FalApiKey;
use log::{error, info};
use openai_sora_client::sora_error::SoraError::AnyhowError;
use primitives::traits::trim_or_emptyable::TrimOrEmptyable;
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};

#[derive(Serialize)]
pub struct GetFalApiKeyResponse {
  pub key: Option<String>,
}

impl SerializeMarker for GetFalApiKeyResponse {}

#[tauri::command]
pub async fn get_fal_api_key_command(
  creds_manager: State<'_, FalCredentialManager>,
) -> CommandResult<GetFalApiKeyResponse, (), ()> {

  let key = get_key(&creds_manager)
      .await
      .map_err(|err| {
        error!("Error getting API key: {:?}", err);
        "error getting key"
      })?;

  Ok(key.into())
}

async fn get_key(
  creds_manager: &FalCredentialManager,
) -> AnyhowResult<GetFalApiKeyResponse> {
  let maybe_key = creds_manager.get_key()?
      .map(|key| key.0)
      .map(|key| key.trim().to_string())
      .filter(|key| !key.is_empty());
  
  Ok(GetFalApiKeyResponse { key: maybe_key })
}
