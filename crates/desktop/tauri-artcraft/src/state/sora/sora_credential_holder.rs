use std::ops::Deref;
use std::sync::{Arc, RwLock};
use anyhow::anyhow;
use errors::AnyhowResult;
use openai_sora_client::credentials::SoraCredentials;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;

// TODO: This is just so we can phase in the new credentials
pub struct Inner {
  credentials: Option<SoraCredentials>,
  credential_set: Option<SoraCredentialSet>,
}

/// Hold credentials for the application.
#[derive(Clone)]
pub struct SoraCredentialHolder {
  credentials: Arc<RwLock<Inner>>,
}

impl SoraCredentialHolder {
  pub fn new() -> Self {
    Self {
      credentials: Arc::new(RwLock::new(Inner {
        credentials: None,
        credential_set: None,
      })),
    }
  }

  pub fn set_credentials(&self, credentials: &SoraCredentials) -> AnyhowResult<()> {
    match self.credentials.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut creds) => {
        creds.credentials = Some(credentials.clone());
        Ok(())
      }
    }
  }

  pub fn clear_credentials(&self) -> AnyhowResult<()> {
    match self.credentials.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut creds) => {
        creds.credentials = None;
        Ok(())
      }
    }
  }

  pub fn get_credentials(&self) -> AnyhowResult<Option<SoraCredentials>> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => {
        Ok(creds.credentials.clone())
      }
    }
  }

  pub fn get_credentials_required(&self) -> AnyhowResult<SoraCredentials> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => match &creds.credentials {
        None => Err(anyhow!("Credentials not set")),
        Some(creds) => Ok(creds.clone()),
      }
    }
  }
}
