use crate::creds::sora_credential_builder::SoraCredentialBuilder;
use crate::creds::sora_credential_set::SoraCredentialSet;
use errors::AnyhowResult;
use std::fs::read_to_string;

#[cfg(test)]
pub fn get_test_credentials() -> AnyhowResult<SoraCredentialSet> {
  // TODO: This should work on other folks' machines when they exist
  //  This is so brittle...
  let sentinel = read_to_string("/Users/bt/Artcraft/credentials/sora_sentinel.txt")?;
  let sentinel = sentinel.trim().to_string();

  let cookie = read_to_string("/Users/bt/Artcraft/credentials/sora_cookies.txt")?;
  let cookie = cookie.trim().to_string();

  let bearer = read_to_string("/Users/bt/Artcraft/credentials/sora_bearer_token.txt")?;
  let bearer = bearer.trim().to_string();

  let creds = SoraCredentialBuilder::new()
      .with_cookies(&cookie)
      .with_jwt_bearer_token(&bearer)
      .with_sora_sentinel(&sentinel)
      .build()?;

  Ok(creds)
}