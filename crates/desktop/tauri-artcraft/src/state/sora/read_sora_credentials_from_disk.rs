use std::fs::read_to_string;
use errors::AnyhowResult;
use openai_sora_client::credentials::SoraCredentials;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use crate::state::app_dir::AppDataRoot;

// TODO: This is only to migrate to the new type.
pub struct CredentialsPayload {
  pub credentials: SoraCredentials,
  pub credentials_set: SoraCredentialSet,
}

pub fn read_sora_credentials_from_disk(app_data_root: &AppDataRoot) -> AnyhowResult<CredentialsPayload> {
  let cookie_file = app_data_root.get_sora_cookie_file_path();
  let bearer_file = app_data_root.get_sora_bearer_token_file_path();
  let sentinel_file = app_data_root.get_sora_sentinel_file_path();

  let cookie = read_to_string(cookie_file)?
      .trim()
      .to_string();

  let bearer = read_to_string(bearer_file)?
      .trim()
      .to_string();

  let mut credentials;

  if sentinel_file.exists() && sentinel_file.is_file() {
    let sentinel = read_to_string(sentinel_file)?
        .trim()
        .to_string();

    credentials = SoraCredentials {
      bearer_token: bearer,
      cookie,
      sentinel: Some(sentinel),
    };
  } else {

    credentials = SoraCredentials {
      bearer_token: bearer,
      cookie,
      sentinel: None,
    };
  }

  Ok(CredentialsPayload {
    credentials_set: SoraCredentialSet::from_legacy_credentials(&credentials)?,
    credentials,
  })
}
