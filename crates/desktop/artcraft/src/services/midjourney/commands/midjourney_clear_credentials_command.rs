use crate::core::commands::response::shorthand::{Response, SimpleResponse};
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use errors::AnyhowResult;
use fal_client::creds::fal_api_key::FalApiKey;
use log::{error, info};
use serde_derive::Deserialize;
use tauri::State;

#[tauri::command]
pub async fn midjourney_clear_credentials_command(
  creds_manager: State<'_, MidjourneyCredentialManager>,
) -> SimpleResponse {
  info!("midjourney_clear_credentials_command called");

  clear_creds(&creds_manager)
      .map_err(|err| {
        error!("Error clearing creds: {:?}", err);
        "error clearing creds"
      })?;

  Ok(().into())
}

fn clear_creds(
  creds: &MidjourneyCredentialManager,
) -> AnyhowResult<()> {
  creds.clear_credentials()?;
  creds.persist_to_disk()?;
  Ok(())
}
