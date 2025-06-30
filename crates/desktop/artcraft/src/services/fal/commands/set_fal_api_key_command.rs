use crate::core::commands::response::shorthand::Response;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use errors::AnyhowResult;
use fal_client::creds::fal_api_key::FalApiKey;
use log::{error, info};
use serde_derive::Deserialize;
use tauri::State;

/// For now, we'll only update a single preference at a time.
#[derive(Deserialize)]
pub struct SetFalApiKeyRequest{
  pub key: Option<String>,
}

#[tauri::command]
pub async fn set_fal_api_key_command(
  request: SetFalApiKeyRequest,
  creds_manager: State<'_, FalCredentialManager>,
) -> Response<(), (), ()> {
  info!("update_app_preferences_command called");

  set_key(request, &creds_manager)
      .await
      .map_err(|err| {
        error!("Error getting app preferences: {:?}", err);
        "error setting key"
      })?;

  Ok(().into())
}

async fn set_key(
  request: SetFalApiKeyRequest,
  creds_manager: &FalCredentialManager,
) -> AnyhowResult<()> {
  
  let key = request.key
      .map(|key| key.trim().to_string())
      .filter(|key| !key.is_empty())
      .map(|key| FalApiKey::from_str(&key));

  match key {
    None => {
      creds_manager.clear_key()?;
      creds_manager.purge_api_key_from_disk()?;
    }
    Some(key) => {
      creds_manager.set_key(&key)?;
      creds_manager.persist_to_disk()?;
    }
  }

  Ok(())
}
