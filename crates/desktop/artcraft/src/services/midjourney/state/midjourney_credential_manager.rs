use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::midjourney::state::midjourney_user_info::MidjourneyUserInfo;
use crate::services::midjourney::state::serializable_midjourney_state::SerializableMidjourneyState;
use crate::services::storyteller::state::read_storyteller_credentials_from_disk::read_storyteller_credentials_from_disk;
use crate::services::storyteller::state::storyteller_credential_holder::StorytellerCredentialHolder;
use cookie_store::cookie_store::CookieStore;
use errors::AnyhowResult;
use log::warn;
use std::fs::read_to_string;
use std::sync::{Arc, RwLock};
use storyteller_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;

#[derive(Clone)]
pub struct MidjourneyCredentialManager {
  // TODO: Put last write/last read timestamps on these.
  cookies: Arc<RwLock<Option<CookieStore>>>,
  user_info: Arc<RwLock<Option<MidjourneyUserInfo>>>,
  app_data_root: AppDataRoot,
}

impl MidjourneyCredentialManager {
  pub fn initialize_empty(app_data_root: &AppDataRoot) -> Self {
    Self {
      cookies: Arc::new(RwLock::new(None)),
      user_info: Arc::new(RwLock::new(None)),
      app_data_root: app_data_root.clone(),
    }
  }

  pub fn initialize_from_disk_infallible(app_data_root: &AppDataRoot) -> Self {
    let mut cookies;
    let mut user_info;
    
    match read_midjourney_state_from_disk(app_data_root) {
      Err(err) => {
        warn!("Failed to read midjourney state from disk: {:?}", err);
        cookies = Arc::new(RwLock::new(None));
        user_info = Arc::new(RwLock::new(None));
      },
      Ok(None) => {
        cookies = Arc::new(RwLock::new(None));
        user_info = Arc::new(RwLock::new(None));
      }
      Ok(Some(state)) => {
        let maybe_cookies = state.user_cookies
            .map(|cookies| cookies.to_cookie_store());
        let maybe_user_info = state.user_info
            .map(|info| {
              MidjourneyUserInfo {
                google_email: info.google_email,
              }
            });
        cookies = Arc::new(RwLock::new(maybe_cookies));
        user_info = Arc::new(RwLock::new(maybe_user_info));
      }
    };

    Self {
      cookies,
      user_info,
      app_data_root: app_data_root.clone(),
    }
  }
  
  pub fn maybe_copy_cookie_store(&self) -> anyhow::Result<Option<CookieStore>> {
    match self.cookies.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(store) => Ok(store.clone()),
    }
  }
  
  pub fn maybe_copy_user_info(&self) -> anyhow::Result<Option<MidjourneyUserInfo>> {
    match self.user_info.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(info) => Ok(info.clone()),
    }
  }
  
  pub fn replace_cookie_store(&self, store: CookieStore) -> anyhow::Result<()> {
    match self.cookies.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut current_store) => {
        *current_store = Some(store);
        Ok(())
      }
    }
  }
}

fn read_midjourney_state_from_disk(root: &AppDataRoot) -> AnyhowResult<Option<SerializableMidjourneyState>> {
  let midjourney_state_path= root.credentials_dir().get_midjourney_state_path();

  if !midjourney_state_path.exists() {
    return Ok(None);
  }
  
  let contents = read_to_string(&midjourney_state_path)?
      .trim()
      .to_string();
  
  let state: SerializableMidjourneyState = serde_json::from_str(&contents)?;

  Ok(Some(state))
}
