use anyhow::anyhow;
use errors::AnyhowResult;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use std::sync::{Arc, RwLock};

/// Hold credentials for the application.
#[derive(Clone)]
pub struct SoraCredentialHolder {
  credentials: Arc<RwLock<Option<SoraCredentialSet>>>,
}

impl SoraCredentialHolder {
  pub fn new() -> Self {
    Self {
      credentials: Arc::new(RwLock::new(None)),
    }
  }

  pub fn set_credentials(&self, credentials: &SoraCredentialSet) -> AnyhowResult<()> {
    match self.credentials.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut creds) => {
        *creds = Some(credentials.clone());
        Ok(())
      }
    }
  }

  pub fn clear_credentials(&self) -> AnyhowResult<()> {
    match self.credentials.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut creds) => {
        *creds = None;
        Ok(())
      }
    }
  }

  pub fn get_credentials(&self) -> AnyhowResult<Option<SoraCredentialSet>> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => {
        Ok(creds.clone())
      }
    }
  }

  pub fn get_credentials_required(&self) -> AnyhowResult<SoraCredentialSet> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => match &*creds {
        None => Err(anyhow!("Credentials not set")),
        Some(creds) => Ok(creds.clone()),
      }
    }
  }
}
