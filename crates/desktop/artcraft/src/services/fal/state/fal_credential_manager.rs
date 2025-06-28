use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::fal::state::read_fal_api_key_from_disk::read_fal_api_key_from_disk;
use anyhow::anyhow;
use errors::AnyhowResult;
use fal_client::creds::fal_api_key::FalApiKey;
use memory_store::clone_slot::CloneSlot;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;
use std::{fs, io};

#[derive(Clone)]
pub struct FalCredentialManager {
  key: CloneSlot<FalApiKey>,
  app_data_root: AppDataRoot,
}

impl FalCredentialManager {
  pub fn new(app_data_root: &AppDataRoot) -> Self {
    Self {
      key: CloneSlot::empty(),
      app_data_root: app_data_root.clone(),
    }
  }
  
  pub fn initialize_from_disk_infallible(app_data_root: &AppDataRoot) -> Self {
    let mut holder = CloneSlot::empty();
    
    match read_fal_api_key_from_disk(app_data_root) {
      Err(err) => {
        log::warn!("Failed to read FAL API key from disk: {:?}", err);
      }
      Ok(api_key) => {
        holder.set_clone(&api_key).expect("Failed to set FAL API key");
      }
    }
    
    Self {
      key: holder,
      app_data_root: app_data_root.clone(),
    }
  }

  pub fn set_key(&self, key: &FalApiKey) -> AnyhowResult<()> {
    if key.0.trim().is_empty() {
      return Err(anyhow!("FAL API key cannot be empty")); // TODO: Also handle upstream.
    }
    self.key.set_clone(key)
  }

  pub fn get_key(&self) -> AnyhowResult<Option<FalApiKey>> {
    self.key.get_clone()
  }
  
  pub fn get_key_required(&self) -> AnyhowResult<FalApiKey> {
    self.key.get_clone_required()
  }
  
  pub fn clear_key(&self) -> AnyhowResult<()> {
    self.key.clear()
  }
  
  /// Does not check the token for validity
  pub fn has_apparent_api_token(&self) -> AnyhowResult<bool> {
    self.key.is_some()
  }
  
  pub fn purge_api_key_from_disk(&self) -> Result<(), io::Error> {
    let filename = self.app_data_root.credentials_dir().get_fal_api_key_file_path();
    if filename.exists() && filename.is_file() {
      fs::remove_file(filename)?;
    }
    Ok(())
  }
  
  pub fn persist_to_disk(&self) -> AnyhowResult<()> {
    let key = match self.get_key() {
      Ok(Some(key)) => key,
      Ok(None) => {
        self.purge_api_key_from_disk()?;
        return Ok(());
      },
      Err(err) => {
        return Err(anyhow!("Failed to get FAL key: {:?}", err));
      }
    };
    
    let filename = self.app_data_root.credentials_dir().get_fal_api_key_file_path();
    
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(filename)?;

    file.write_all(key.0.as_bytes())?;
    file.flush()?;

    Ok(())
  }
}
