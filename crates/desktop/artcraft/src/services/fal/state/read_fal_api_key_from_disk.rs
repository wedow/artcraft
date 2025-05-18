use crate::core::state::data_dir::app_data_root::AppDataRoot;
use anyhow::anyhow;
use errors::AnyhowResult;
use fal_client::creds::fal_api_key::FalApiKey;
use std::fs::read_to_string;

pub fn read_fal_api_key_from_disk(app_data_root: &AppDataRoot) -> AnyhowResult<FalApiKey> {
  let api_key_file = app_data_root.credentials_dir().get_fal_api_key_file_path();

  if !api_key_file.exists() {
    return Err(anyhow!("API key file does not exist: {:?}", api_key_file));
  }

  let value = read_to_string(api_key_file)?
      .trim()
      .to_string();

  Ok(FalApiKey::new(value))
}
