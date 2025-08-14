use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::windows::extract_midjourney_webview_cookies::extract_midjourney_webview_cookies;
use crate::services::midjourney::windows::open_midjourney_login_window::MIDJOURNEY_LOGIN_WINDOW_NAME;
use crate::services::sora::events::sora_login_success_event::SoraLoginSuccessEvent;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::windows::sora_login_window::extract_sora_webview_cookies::extract_sora_webview_cookies;
use anyhow::anyhow;
use cookie_store::cookie_store::CookieStore;
use errors::AnyhowResult;
use log::{error, info};
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::utils::has_session_cookie::{has_session_cookie, SessionCookiePresence};
use tauri::{AppHandle, Manager, WebviewWindow};

pub async fn midjourney_login_window_thread(
  app: AppHandle,
  app_data_root: AppDataRoot,
  mj_creds_manager: MidjourneyCredentialManager,
) {
  loop {
    let login_webview_window = match app.get_webview_window(MIDJOURNEY_LOGIN_WINDOW_NAME) {
      Some(webview) => webview,
      None => {
        info!("Exit midjourney login thread.");
        return; // NB: Only exit if we don't have the webview.
      }
    };

    let result = check_login_window(
      &app,
      &login_webview_window,
      &app_data_root,
      &mj_creds_manager,
    ).await;

    match result {
      Err(err) => {
        error!("Error checking login window: {:?}", err);
      }
      Ok(false) => {} // Continue iteration and try again...
      Ok(true) => {
        info!("Successfully saved cookies from login window. Closing.");
        if let Err(err) = login_webview_window.close() {
          error!("Error closing login window: {:?}", err);
        }
        return;
      }
    }

    tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
  }
}

/// Returns true if we can exit.
async fn check_login_window(
  app_handle: &AppHandle,
  webview_window: &WebviewWindow,
  app_data_root: &AppDataRoot,
  mj_creds_manager: &MidjourneyCredentialManager,
) -> AnyhowResult<bool> {

  /* Login flow looks like this:

  1. Start: https://www.midjourney.com/auth/signin
  2. Login Continue: https://auth.openai.com/log-in
  3. SSO / Google Login (etc): https://accounts.google.com/v3/signin/challenge/pwd?[query]
  4. Done / Landing: https://sora.chatgpt.com/explore
   */

  /*
  - Do not use credential manager until the end (we don't load old cookies!)
  - Check if we're on the correct domain, if not exit? (or inverse, that we're not in login flow)
   */

  let hostname = get_hostname(webview_window)?;

  let mut maybe_at_destination = false;

  match hostname.as_str() {
    "sora.com" | // Old destination
    "sora.chatgpt.com" // New destination
    => {
      maybe_at_destination = true;
    }
    // chatgpt.com/auth is also an auth domain
    "auth.openai.com" |
    "accounts.google.com" |
    "accounts.youtube.com" |
    "login.live.com" |
    "appleid.apple.com"
    => {
      // NB: We're in auth flow.
      info!("Sora login webview is in auth flow; hostname `{}`.", hostname);
      return Ok(false)
    }
    _ => {}, // We just don't know...
  }

  let cookie_store = extract_midjourney_webview_cookies(webview_window)?;

  //let session_cookie_presence = has_session_cookie(&webview_cookies)
  //    .unwrap_or_else(|err| {
  //      error!("Failed to check for session cookie: {:?}", err);
  //      SessionCookiePresence::MaybePresent
  //    });

  //info!("Midjourney login webview is at hostname `{}`; cookie status: {:?}.", hostname, session_cookie_presence);

  //match session_cookie_presence {
  //  SessionCookiePresence::Absent => {
  //    info!("Session cookies are absent.");
  //    return Ok(false);
  //  }
  //  _ => {},
  //}

  mj_creds_manager.replace_cookie_store(cookie_store)?;

  if true {
    return Ok(false);
  }

  //let mut new_credentials =
  //    SoraCredentialSet::initialize_with_just_cookies_str(&webview_cookies);

  //let _upgraded = maybe_upgrade_or_renew_session(&mut new_credentials).await?;

  //// TODO(bt): Race conditions ahead.

  //sora_credential_manager.clear_credentials()?;
  //sora_credential_manager.try_purge_credentials_from_disk();

  //sora_credential_manager.set_credentials(&new_credentials)?;
  //sora_credential_manager.persist_all_to_disk()?;

  //// NB: Event sent to the frontend for the login flow. We shouldn't rely on just this
  //// alone as it could be brittle if the events aren't caught.
  //let event = SoraLoginSuccessEvent {};

  //if let Err(err) = event.send(app_handle) {
  //  error!("Error sending Sora login success event: {:?}", err);
  //}

  Ok(true)
}

fn get_hostname(webview: &WebviewWindow) -> AnyhowResult<String> {
  let url = webview.url()?;
  let url_hostname= url.host()
      .ok_or(anyhow!("no host in url"))?
      .to_string();
  Ok(url_hostname)
}
