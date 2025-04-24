use anyhow::anyhow;
use errors::AnyhowResult;
use openai_sora_client::credentials::SoraCredentials;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use std::sync::{Arc, RwLock};

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

  pub fn set_legacy_credentials(&self, credentials: &SoraCredentials) -> AnyhowResult<()> {
    let credential_set = SoraCredentialSet::from_legacy_credentials(credentials)?;
    match self.credentials.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut creds) => {
        creds.credentials = Some(credentials.clone());
        creds.credential_set = Some(credential_set);
        Ok(())
      }
    }
  }

  pub fn set_credentials(&self, credentials: &SoraCredentialSet) -> AnyhowResult<()> {
    let credentials_legacy = credentials.to_legacy_credentials()?;
    match self.credentials.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut creds) => {
        creds.credentials = Some(credentials_legacy);
        creds.credential_set = Some(credentials.clone());
        Ok(())
      }
    }
  }

  pub fn clear_credentials(&self) -> AnyhowResult<()> {
    match self.credentials.write() {
      Err(err) => Err(anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut creds) => {
        creds.credentials = None;
        creds.credential_set = None;
        Ok(())
      }
    }
  }

  pub fn get_legacy_credentials(&self) -> AnyhowResult<Option<SoraCredentials>> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => {
        Ok(creds.credentials.clone())
      }
    }
  }

  pub fn get_legacy_credentials_required(&self) -> AnyhowResult<SoraCredentials> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => match &creds.credentials {
        None => Err(anyhow!("Credentials not set")),
        Some(creds) => Ok(creds.clone()),
      }
    }
  }

  pub fn get_credentials(&self) -> AnyhowResult<Option<SoraCredentialSet>> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => {
        Ok(creds.credential_set.clone())
      }
    }
  }

  pub fn get_credentials_required(&self) -> AnyhowResult<SoraCredentialSet> {
    match self.credentials.read() {
      Err(err) => Err(anyhow!("Failed to acquire read lock: {:?}", err)),
      Ok(creds) => match &creds.credential_set {
        None => Err(anyhow!("Credentials not set")),
        Some(creds) => Ok(creds.clone()),
      }
    }
  }
}
