use crate::commands::app_preferences::get_app_preferences_command::AppPreferencesPayload;
use crate::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::state::data_dir::app_data_root::AppDataRoot;
use crate::state::sora::sora_credential_manager::SoraCredentialManager;
use crate::windows::sora_login_window::open_sora_login_window::open_sora_login_window;
use errors::AnyhowResult;
use log::{error, info};
use once_cell::sync::Lazy;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::list_media::list_media::list_media;
use serde_derive::Serialize;
use tauri::{AppHandle, State};

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub struct CheckSoraSessionCommand {
  pub state: SoraSessionState,
  pub maybe_account_email: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SoraSessionState{
  #[serde(rename = "not_set_up")]
  NotSetUp,
  #[serde(rename = "expired_or_error")]
  ExpiredOrError,
  #[serde(rename = "valid")]
  Valid,
}


#[tauri::command]
pub async fn check_sora_session_command(
  app: AppHandle,
  sora_creds_manager: State<'_, SoraCredentialManager>,
) -> Result<CheckSoraSessionCommand, CheckSoraSessionCommand> {
  info!("check_sora_session_command called");

  match do_check(&sora_creds_manager).await {
    Ok(state) => Ok(state),
    Err(err) => {
      error!("Error checking session state: {:?}", err);
      Err(CheckSoraSessionCommand {
        state: SoraSessionState::ExpiredOrError,
        maybe_account_email: None,
      })
    }
  }
}

async fn do_check(
  sora_creds_manager: &SoraCredentialManager,
) -> AnyhowResult<CheckSoraSessionCommand> {
  
  let mut creds = match sora_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Ok(CheckSoraSessionCommand {
        state: SoraSessionState::NotSetUp,
        maybe_account_email: None,
      });
    }
  };
  
  let upgraded = maybe_upgrade_or_renew_session(&mut creds).await?;
  
  list_media(&creds).await?;

  if upgraded {
    info!("Saving upgraded session to manager and disk...");
    sora_creds_manager.set_credentials(&creds)?;
    sora_creds_manager.persist_all_to_disk()?;
  }
  
  let maybe_account_email = creds
      .jwt_bearer_token
      .map(|token| token.jwt_claims().email.clone());

  Ok(CheckSoraSessionCommand {
    state: SoraSessionState::Valid,
    maybe_account_email,
  })
}
