use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::refresh_account_state_event::RefreshAccountStateEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::window::get_webview_window_hostname::get_webview_window_hostname;
use crate::core::utils::window::get_webview_window_url_path::get_webview_window_url_path;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::sora::events::sora_login_success_event::SoraLoginSuccessEvent;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::windows::sora_login_window::extract_sora_webview_cookies::extract_sora_webview_cookies;
use crate::services::worldlabs::state::worldlabs_bearer_bridge::WorldlabsBearerBridge;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use crate::services::worldlabs::windows::worldlabs_login_window::worldlabs_login_webview_extract_cookies::worldlabs_login_webview_extract_cookies;
use crate::services::worldlabs::windows::worldlabs_login_window::worldlabs_login_window_open::WORLDLABS_LOGIN_WINDOW_NAME;
use anyhow::anyhow;
use cookie_store::cookie_store::CookieStore;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use log::{error, info};
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::utils::has_session_cookie::{has_session_cookie, SessionCookiePresence};
use tauri::{AppHandle, Manager, WebviewWindow};

pub async fn worldlabs_login_window_thread(
  app: AppHandle,
  app_data_root: AppDataRoot,
  worldlabs_bearer_bridge: WorldlabsBearerBridge,
  worldlabs_creds_manager: WorldlabsCredentialManager,
) {
  let mut visited_login = false;

  loop {
    let login_webview_window = match app.get_webview_window(WORLDLABS_LOGIN_WINDOW_NAME) {
      Some(webview) => webview,
      None => {
        info!("Exit WorldLabs login thread.");
        return; // NB: Only exit if we don't have the webview.
      }
    };

    let result = check_login_window(
      &app,
      &login_webview_window,
      &app_data_root,
      &worldlabs_bearer_bridge,
      &worldlabs_creds_manager,
      &mut visited_login,
    ).await;

    match result {
      Err(err) => {
        error!("Error checking Grok login window: {:?}", err);
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

/// NOTE: THERE IS THIS - https://marble.worldlabs.ai/sign-in?redirect=%2Fworlds

/// Returns true if we can exit.
async fn check_login_window(
  app_handle: &AppHandle,
  webview_window: &WebviewWindow,
  app_data_root: &AppDataRoot,
  worldlabs_bearer_bridge: &WorldlabsBearerBridge,
  worldlabs_creds_manager: &WorldlabsCredentialManager,
  visited_login: &mut bool,
) -> AnyhowResult<bool> {

  // World labs has no distinct login page. Everything is in a single SPA.

  let mut is_logged_in = false;

  // See if pricing exists.
  // We'll use redirection to detect if we're done.
  let pricing_script = r#"
    (() => {
      let pricing = document.querySelectorAll("a[href='/pricing']");
      console.log('pricing', pricing);
      if (pricing.length > 0) {
        window.location.href = "https://www.worldlabs.ai/about";
      }
    })();
  "#;

  //webview_window.eval(pricing_script)?;

  let extract_bearer_tokens= r#"
    (() => {
      if (window.tokens) {
        console.error(">>> Tokens already gotten !");
        return;
      }

      console.error(">>> Getting tokens...");

      const request = indexedDB.open("firebaseLocalStorageDb");
      request.onerror = (event) => {};

      request.onsuccess = (event) => {
        const db = event.target.result;

        const tx = db.transaction("firebaseLocalStorage", "readonly");
        const store = tx.objectStore("firebaseLocalStorage");

        const keysRequest = store.getAllKeys();

        keysRequest.onerror = (event) => {};

        keysRequest.onsuccess = () => {
          const keys = keysRequest.result; // array of keys
          const key = keys[0];

          const getKeyRequest = store.getKey(key);

          getKeyRequest.onsuccess = () => {};

          store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              let tokens = cursor.value?.value?.stsTokenManager;
              if (tokens?.accessToken && tokens?.refreshToken) {
                window.tokens = tokens;
              }
              cursor.continue();
            }
          };
        };
      };
    })();
  "#;

  webview_window.eval(extract_bearer_tokens)?;

  let export_bearer_tokens= r#"
    (async () => {
      if (!(window.tokens?.accessToken && window.tokens?.refreshToken)) {
        console.error(">>> No tokens to export");
        return;
      }

      console.error(">>> Sending to Tauri");

      let result = await window.__TAURI__.core.invoke("worldlabs_receive_bearer_command", {
        request: {
          bearer_token: window.tokens.accessToken,
          refresh_token: window.tokens.refreshToken,
        }
      });

      error.log('>>> result', result);

    })();
  "#;

  webview_window.eval(export_bearer_tokens)?;

  let maybe_bearer = worldlabs_bearer_bridge.get()?;

  if let Some(bearer) = maybe_bearer {
    info!("Rust Got bearer: {:?}", bearer);
  }


  let hostname = get_webview_window_hostname(webview_window)?;
  let path = get_webview_window_url_path(webview_window)?;

  match hostname.as_str() {
    "www.worldlabs.ai" => {
      is_logged_in = true;
    },
    _ => {}
  }

  match path.as_str() {
    "/about" => {
      is_logged_in = true;
    },
    _ => {}
  }

  is_logged_in = false;

  if !is_logged_in {
    return Ok(false);
  }

  let cookie_store = worldlabs_login_webview_extract_cookies(webview_window)?;

  info!("Current cookies (len {}): {:?}", cookie_store.len(), cookie_store.to_cookie_string());

  worldlabs_creds_manager.replace_cookie_store(cookie_store)?;

  let result = worldlabs_creds_manager.persist_to_disk();

  if let Err(err) = result {
    error!("Error persisting grok cookies to disk: {:?}", err);
    return Ok(false);
  }

  let event = RefreshAccountStateEvent {
    provider: Some(GenerationProvider::WorldLabs),
  };

  if let Err(err) = event.send(&app_handle) {
    error!("Failed to send RefreshAccountStateEvent: {:?}", err); // Fail open
  }

  Ok(true)
}

