use crate::core::commands::response::shorthand::Response;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use errors::AnyhowResult;
use log::error;
use serde_derive::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct GetFalApiKeyResponse {
  pub key: Option<String>,
}

impl SerializeMarker for GetFalApiKeyResponse {}

#[tauri::command]
pub async fn get_fal_api_key_command(
  creds_manager: State<'_, FalCredentialManager>,
) -> Response<GetFalApiKeyResponse, (), ()> {

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
