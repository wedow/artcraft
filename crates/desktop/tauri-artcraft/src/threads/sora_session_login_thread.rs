use std::fs;
use crate::state::app_dir::AppDataRoot;
use crate::state::sora::sora_credential_holder::SoraCredentialHolder;
use crate::state::sora::sora_credential_manager::SoraCredentialManager;
use crate::utils::sora::initialize_sora_jwt_bearer_token::initialize_sora_jwt_bearer_token;
use crate::utils::sora_webview_cookies::get_all_sora_cookies_as_string;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{error, info, warn};
use once_cell::sync::Lazy;
use reqwest::Url;
use std::fs::{read_to_string, OpenOptions};
use std::io::Write;
use std::ops::Sub;
use chrono::{DateTime, NaiveDateTime, TimeDelta};
use tauri::{AppHandle, Manager, Webview};

pub const LOGIN_WINDOW_NAME: &str = "login_window";

pub const SORA_LOGIN_URL_STR: &str = "https://sora.com/auth/login?callback_path=/";

pub static SORA_LOGIN_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse(SORA_LOGIN_URL_STR).expect("URL should parse")
});

pub const SORA_ROOT_URL_STR: &str = "https://sora.com/";

pub static SORA_ROOT_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse(SORA_ROOT_URL_STR).expect("URL should parse")
});

pub async fn sora_session_login_thread(
  app: AppHandle,
  app_data_root: AppDataRoot,
  sora_creds_manager: SoraCredentialManager
) -> ! {
  loop {
    for (window_name, webview) in app.webviews() {
      if window_name == LOGIN_WINDOW_NAME {
        let result = check_login_window(
          &webview,
          &app_data_root,
          &sora_creds_manager,
        ).await;
        if let Err(err) = result {
          error!("Error checking login window: {:?}", err);
        }
        break;
      }
    }
    tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
  }
}

async fn check_login_window(
  webview: &Webview,
  app_data_root: &AppDataRoot,
  sora_credential_manager: &SoraCredentialManager,
) -> AnyhowResult<()> {
  clear_browsing_data_on_test_domain(webview)?;
  //keep_on_task(webview)?;
  extract_cookies_to_file(webview, app_data_root, sora_credential_manager)?;
  //initialize_sora_jwt_bearer_token(app_data_root).await?; // TODO: This only runs once. We need better management.
  Ok(())
}

fn keep_on_task(webview: &Webview) -> AnyhowResult<()> {
  let url = webview.url()?;
  let hostname= url.host()
      .ok_or(anyhow!("no host in url"))?
      .to_string();
  match hostname.as_str() {
    "auth.openai.com" => {},
    "openai.com" => {},
    "sora.com" => {},
    // Third party SSO
    "accounts.google.com" => {},
    "accounts.youtube.com" => {},
    "login.live.com" => {},
    "appleid.apple.com" => {},
    _ => {
      info!("Non login hostname: {}", hostname);
      webview.navigate(SORA_LOGIN_URL.clone())?;
    }
  }
  Ok(())
}

/// This is just so we have a way to clear browsing data.
fn clear_browsing_data_on_test_domain(webview: &Webview) -> AnyhowResult<()> {
  let url = webview.url()?;
  let hostname= url.host()
      .ok_or(anyhow!("no host in url"))?
      .to_string();
  match hostname.as_str() {
    "storyteller.ai" => {
      info!("Clearing all browsing data...");
      webview.clear_all_browsing_data()?;
    }
    _ => {}
  }
  Ok(())
}

// TODO(bt,2025-04-07): Heuristic to detect when logged in. Only write when logged in.
fn extract_cookies_to_file(
  webview: &Webview,
  app_data_root: &AppDataRoot,
  sora_credential_manager: &SoraCredentialManager,
) -> AnyhowResult<()> {
  let new_cookies = get_all_sora_cookies_as_string(webview)?.trim().to_string();
  let maybe_old_cookies = read_sora_cookies_from_disk(app_data_root);

  let mut should_write_cookies = maybe_old_cookies.is_none();

  if let Some(old_cookies) = maybe_old_cookies {
    should_write_cookies = old_cookies != new_cookies;
  }

  if !should_write_cookies {
    return Ok(());
  }

  // TODO(bt): Race conditions ahead.

  sora_credential_manager.clear_credentials()?;

  fs::remove_file(app_data_root.get_sora_cookie_file_path())?;
  fs::remove_file(app_data_root.get_sora_bearer_token_file_path())?;
  fs::remove_file(app_data_root.get_sora_sentinel_file_path())?;

  let cookie_file = app_data_root.get_sora_cookie_file_path();

  let mut file = OpenOptions::new()
      .create(true)
      .write(true)
      .truncate(true)
      .open(cookie_file)?;

  file.write_all(new_cookies.as_bytes())?;
  file.flush()?;

  sora_credential_manager.reset_from_disk()?;

  Ok(())
}

pub fn read_sora_cookies_from_disk(app_data_root: &AppDataRoot) -> Option<String> {
  let cookie_file = app_data_root.get_sora_cookie_file_path();
  if !cookie_file.exists() {
    return None;
  }

  match read_to_string(cookie_file) {
    Ok(contents) => Some(contents.trim().to_string()),
    Err(err) => {
      warn!("Failed to read cookie file: {:?}", err);
      None
    }
  }
}
