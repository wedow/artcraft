use crate::core::commands::response::shorthand::{Response, ResponseOrErrorMessage};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct WorldlabsGetCredentialInfoResponse {
  pub maybe_email: Option<String>,
  pub can_clear_state: bool,
}

impl SerializeMarker for WorldlabsGetCredentialInfoResponse {}

#[tauri::command]
pub async fn worldlabs_get_credential_info_command(
  creds_manager: State<'_, WorldlabsCredentialManager>,
) -> ResponseOrErrorMessage<WorldlabsGetCredentialInfoResponse> {
  info!("worldlabs_get_credential_info_command called");

  let info = get_info(&creds_manager)
      .map_err(|err| {
        error!("Error getting info: {:?}", err);
        "error getting info"
      })?;

  Ok(info.into())
}

fn get_info(
  creds: &WorldlabsCredentialManager,
) -> AnyhowResult<WorldlabsGetCredentialInfoResponse> {
  let mut can_clear_state = true;
  
  let maybe_cookies = creds.maybe_copy_cookie_store()?;

  //let maybe_full_credentials = creds.user()?;
  //
  //if maybe_cookies.is_none()  && maybe_full_credentials.is_none() {
  //  can_clear_state = false;
  //}
  //
  //let maybe_email = maybe_full_credentials
  //    .map(|full_creds| full_creds.client_secrets.user_email)
  //    .map(|maybe_email| maybe_email.map(|email| email.to_string()))
  //    .flatten();

  if maybe_cookies.is_none() {
    can_clear_state = false;
  }
  
  Ok(WorldlabsGetCredentialInfoResponse {
    maybe_email: None,
    can_clear_state,
  })
}
