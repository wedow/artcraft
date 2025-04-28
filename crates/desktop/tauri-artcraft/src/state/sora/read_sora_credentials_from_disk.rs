use crate::state::app_dir::AppDataRoot;
use anyhow::anyhow;
use errors::AnyhowResult;
use openai_sora_client::creds::sora_cookies::SoraCookies;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use openai_sora_client::creds::sora_sentinel::SoraSentinel;
use std::fs::read_to_string;

pub fn read_sora_credentials_from_disk(app_data_root: &AppDataRoot) -> AnyhowResult<SoraCredentialSet> {
  let cookie_file = app_data_root.get_sora_cookie_file_path();
  let bearer_file = app_data_root.get_sora_bearer_token_file_path();
  let sentinel_file = app_data_root.get_sora_sentinel_file_path();

  if !cookie_file.exists() {
    return Err(anyhow!("Cookie file does not exist: {:?}", cookie_file));
  }

  let value = read_to_string(cookie_file)?
      .trim()
      .to_string();

  let cookie = SoraCookies::new(value);

  let mut bearer = None;
  let mut sentinel = None;

  if bearer_file.exists() {
    let value = read_to_string(&bearer_file)?
        .trim()
        .to_string();
    bearer = Some(SoraJwtBearerToken::new(value)?);
  }

  if sentinel_file.exists() {
    let value = read_to_string(&sentinel_file)?
        .trim()
        .to_string();

    sentinel = Some(SoraSentinel::new(value));
  }

  Ok(SoraCredentialSet::initialize(
    cookie,
    bearer,
    sentinel,
  ))
}
