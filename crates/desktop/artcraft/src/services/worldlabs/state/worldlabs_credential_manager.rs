use crate::core::state::data_dir::app_data_root::AppDataRoot;
use cookie_store::cookie_store::CookieStore;
use errors::AnyhowResult;
use log::{info, warn};
use std::fs::read_to_string;
use std::sync::{Arc, RwLock};
use world_labs_client::credentials::world_labs_cookies::WorldLabsCookies;
use crate::services::worldlabs::state::worldlabs_credential_holder::WorldlabsCredentialHolder;
use crate::services::worldlabs::state::worldlabs_serializable_state::{WorldlabsSerializableState, SERIALIZABLE_WORLDLABS_STATE_VERSION};

#[derive(Clone)]
pub struct WorldlabsCredentialManager {
  // TODO: Put last write/last read timestamps on these.
  credential_data: Arc<RwLock<WorldlabsCredentialHolder>>,

  //user_info: Arc<RwLock<Option<MidjourneyUserInfo>>>,
  app_data_root: AppDataRoot,
}

impl WorldlabsCredentialManager {
  pub fn initialize_empty(app_data_root: &AppDataRoot) -> Self {
    Self {
      credential_data: Arc::new(RwLock::new(WorldlabsCredentialHolder::empty())),
      app_data_root: app_data_root.clone(),
    }
  }

  pub fn initialize_from_disk_infallible(app_data_root: &AppDataRoot) -> Self {
    let mut credential_data;

    let result = WorldlabsSerializableState::read_from_disk(app_data_root);
    match result {
      Err(err) => {
        warn!("Failed to read worldlabs state from disk: {:?}", err);
        credential_data = Arc::new(RwLock::new(WorldlabsCredentialHolder::empty()));
      },
      Ok(None) => {
        credential_data = Arc::new(RwLock::new(WorldlabsCredentialHolder::empty()));
      }
      Ok(Some(state)) => {
        let maybe_cookies = state.user_cookies
            .map(|cookies| cookies.to_cookie_store());

        let mut user_data = None;
        if let Some(user_id) = state.user_id {
          user_data = Some(WorldlabsUserData::from_id_and_email(user_id, state.user_email));
        }

        credential_data = Arc::new(RwLock::new(WorldlabsCredentialHolder {
          browser_cookies: maybe_cookies,
          worldlabs_full_credentials: None, // NB: We don't want to keep this on disk. It goes stale.
        }));
      }
    };

    Self {
      credential_data,
      app_data_root: app_data_root.clone(),
    }
  }

  pub fn maybe_copy_cookie_store(&self) -> anyhow::Result<Option<CookieStore>> {
    match self.credential_data.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(holder) => Ok(holder.browser_cookies.clone()),
    }
  }

  pub fn maybe_copy_cookie_header_string(&self) -> anyhow::Result<Option<String>> {
    let maybe_cookies = self.maybe_copy_cookie_store()?;
    let maybe_cookies = maybe_cookies.map(|cookies| {
      cookies.to_cookie_string()
    });
    Ok(maybe_cookies)
  }

  pub fn maybe_copy_typed_cookies(&self) -> anyhow::Result<Option<WorldLabsCookies>> {
    let maybe_cookies = self.maybe_copy_cookie_header_string()?;
    let maybe_cookies = maybe_cookies.map(|cookies| {
      WorldLabsCookies::new(cookies)
    });
    Ok(maybe_cookies)
  }

  pub fn maybe_copy_full_credentials(&self) -> anyhow::Result<Option<WorldLabsFullCredentials>> {
    match self.credential_data.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(holder) => Ok(holder.worldlabs_full_credentials.clone()),
    }
  }

  pub fn replace_cookie_store(&self, store: CookieStore) -> anyhow::Result<()> {
    match self.credential_data.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut holder) => {
        holder.browser_cookies = Some(store);
        Ok(())
      }
    }
  }

  pub fn replace_full_credentials(&self, creds: WorldlabsFullCredentials) -> anyhow::Result<()> {
    match self.credential_data.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut holder) => {
        holder.worldlabs_full_credentials = Some(creds);
        Ok(())
      }
    }
  }

  pub fn replace_client_secrets_only(&self, secrets: WorldLabsClientSecrets) -> anyhow::Result<()> {
    match self.credential_data.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut holder) => {
        let mut maybe_full_creds = holder.worldlabs_full_credentials.clone();
        if let Some(creds) = maybe_full_creds.as_mut() {
          creds.client_secrets = secrets;
        } else {
          warn!("No existing credentials to replace secrets into.");
        }
        holder.worldlabs_full_credentials = maybe_full_creds;
        Ok(())
      }
    }
  }

  // NB: This is just a heuristic. We'll add better checks later.
  pub fn do_task_polling(&self) -> anyhow::Result<bool> {
    self.session_appears_active()
  }

  // NB: This is just a heuristic. We'll add better checks later.
  pub fn session_appears_active(&self) -> anyhow::Result<bool> {
    let holder = match self.credential_data.read() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => store.clone(),
    };

    if holder.worldlabs_full_credentials.is_some() {
      return Ok(true);
    }

    if holder.browser_cookies.is_none() {
      return Ok(false);
    }

    // TODO: Heuristic
    Ok(true)

    //let cookies = match holder.browser_cookies.as_ref() {
    //  None => return Ok(false),
    //  Some(cookies) => cookies,
    //};
    //// NB: We consider the session active if we have auth cookies and a user id.
    ////let has_user_id = user_info.user_id.is_some();
    ////let maybe_has_auth_cookies = cookie_store_has_auth_cookies(&cookies);
    //let maybe_has_auth_cookies = true; // TODO TODO TODO - fix this
    //// Misc cookies without login cookies are ~1055 length
    //// AUTH_I is ~1500 length
    //// AUTH_R is ~500 length
    //let maybe_has_big_enough_cookie = cookies.calculate_approx_cookie_character_length() > 2100;
    //// TODO: Heuristic should count.
    //// TODO: Consolidate with "login window thread" logic.
    //// TODO: Check timestamp of last valid request.
    //Ok((maybe_has_auth_cookies && maybe_has_big_enough_cookie && maybe_has_big_enough_cookie))
  }

  pub fn clear_credentials(&self) -> anyhow::Result<()> {
    match self.credential_data.write() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut store) => *store = WorldlabsCredentialHolder::empty(),
    }
    Ok(())
  }

  pub fn persist_to_disk(&self) -> anyhow::Result<()> {
    let creds = match self.credential_data.read() {
      Err(err) => return Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(store) => store.clone(),
    };

    let state = WorldlabsSerializableState {
      version: SERIALIZABLE_WORLDLABS_STATE_VERSION,
      user_cookies: creds.browser_cookies
          .as_ref()
          .map(|cookies| cookies.to_serializable()),
      user_id: creds.worldlabs_full_credentials
          .as_ref()
          .map(|creds| creds.client_secrets.user_id.to_string()),
      user_email: creds.worldlabs_full_credentials
          .as_ref()
          .map(|data| data.client_secrets.user_email.as_ref())
          .flatten()
          .map(|email| email.to_string()),
    };

    let path = self.app_data_root.credentials_dir().get_grok_state_path();
    let serialized = serde_json::to_string(&state)?;

    std::fs::write(path, serialized)?;

    // TODO: This is just for building the client and testing.
    if let Some(cookies) = creds.browser_cookies.as_ref() {
      let cookies_header = cookies.to_cookie_string();
      let path = self.app_data_root.credentials_dir().get_grok_cookies_path();
      std::fs::write(path, cookies_header)?;
    }

    Ok(())
  }
}

