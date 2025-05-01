use crate::state::data_dir::app_data_root::AppDataRoot;
use crate::state::storyteller::storyteller_credential_manager::StorytellerCredentialManager;
use crate::threads::sora_session_login_thread::LOGIN_WINDOW_NAME;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{debug, error, info};
use once_cell::sync::Lazy;
use reqwest::Url;
use std::fs;
use chrono::TimeDelta;
use storyteller_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use tauri::{AppHandle, Manager, Webview, Window};
use crate::state::app_startup_time::AppStartupTime;

const MAIN_WEBVIEW_NAME: &str = "main";

const STORYTELLER_ROOT_COOKIE_URL_STR: &str = "https://api.storyteller.ai/";

static STORYTELLER_ROOT_COOKIE_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse(STORYTELLER_ROOT_COOKIE_URL_STR).expect("URL should parse")
});

const AVT_COOKIE_NAME : &str = "visitor";
const SESSION_COOKIE_NAME : &str = "session";

/// There's some kind of race condition that we need to wait for before inspecting cookies.
const RACE_CONDITION_WAIT_TIME: TimeDelta = TimeDelta::milliseconds(5000);

pub async fn persist_storyteller_cookies_task(
  window: &Window,
  app_data_root: &AppDataRoot,
  storyteller_credential_manager: &StorytellerCredentialManager,
  app_startup_time: &AppStartupTime,
) -> AnyhowResult<()> {

  if app_startup_time.time_delta_since() < RACE_CONDITION_WAIT_TIME {
    // NB:     There's an issue when the "main window thread" inquires about the
    //     webview cookies shortly after app startup. When it attempts to dump the
    //     cookies within a few milliseconds of app launch, it deadlocks and the
    //     app never launches correctly. The entire webview goes blank and the app
    //     freezes. This hack seems to fix the problem.
    return Ok(())
  }

  for webview in window.webviews() {
    let label = webview.label();
    if label == MAIN_WEBVIEW_NAME {
      persist_webview_cookies(&webview, app_data_root, storyteller_credential_manager).await?;
      break;
    }
  }
  
  Ok(())
}

async fn persist_webview_cookies(
  webview: &Webview,
  app_data_root: &AppDataRoot,
  storyteller_credential_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {
  let current_webview_credentials = get_storyteller_cookies(webview).await?;

  if current_webview_credentials.is_empty() {
    // TODO: handle logout / cookie deletion
    return Ok(());
  }
  
  let mut replace_credentials = true;

  let maybe_old_credentials = storyteller_credential_manager.get_credentials()?;

  if let Some(old_credentials) = maybe_old_credentials {
    if old_credentials.equals(&current_webview_credentials) {
      replace_credentials = false;
    }
  }
  
  if replace_credentials {
    info!("Writing ArtCraft credentials to disk...");
    storyteller_credential_manager.set_credentials(&current_webview_credentials)?;
    storyteller_credential_manager.persist_all_to_disk()?;
  }
  
  Ok(())
}

pub async fn get_storyteller_cookies(webview: &Webview) -> AnyhowResult<StorytellerCredentialSet> {
  debug!("Getting storyteller cookies...");

  //// FIXME: THIS IS A TOTAL HACK. / DO NOT REMOVE.
  //// NB: If we don't call a method on the webview, the very next call to get cookies will deadlock.
  //if let Ok(url) = webview.url() {
  //  debug!("For url: {:?}", url);
  //}

  let cookies = webview.cookies_for_url(STORYTELLER_ROOT_COOKIE_URL.clone())?;

  info!("Got storyteller cookies: {:?}", cookies);
  info!("Got storyteller cookies: {:?}", cookies.len());
  info!("Got storyteller location: {:?}", webview.url());
  
  let mut avt_cookie = None;
  let mut session_cookie = None;

  for cookie in cookies.into_iter() {
    if let Some(avt) = StorytellerAvtCookie::maybe_from_cookie(&cookie) {
      avt_cookie = Some(avt);
    } else if let Some(session) = StorytellerSessionCookie::maybe_from_cookie(&cookie) {
      session_cookie = Some(session);
    }
  }

  Ok(StorytellerCredentialSet::initialize(
    avt_cookie,
    session_cookie,
  ))
}
