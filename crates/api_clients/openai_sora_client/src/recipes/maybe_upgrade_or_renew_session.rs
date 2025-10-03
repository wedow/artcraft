use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::creds::sora_sentinel::SoraSentinel;
use crate::error::sora_error::SoraError;
use crate::requests::auth_bearer::generate_bearer_jwt_with_cookie::generate_bearer_jwt_with_cookie;
use crate::requests::auth_sentinel::generate_sentinel_token::generate_sentinel_token;
use chrono::{DateTime, TimeDelta, Utc};
use errors::AnyhowResult;
use log::info;
use std::ops::Sub;

const EXPIRATION_DEADLINE : TimeDelta = TimeDelta::hours(12);

/// Call this at session startup to generate the tokens for the first time.
/// Call this periodically to refresh the JWT as it nears its expiration date.
/// This will not refresh the sentinel token once it's been generated - we can use other flows to accomplish that.
#[deprecated(note="The sentinel appears to be going away. Use `maybe_renew_session_jwt` instead for newer '2.0' code.")]
pub async fn maybe_upgrade_or_renew_session(sora_credentials: &mut SoraCredentialSet) -> Result<bool, SoraError> {
  let mut refresh_jwt = !sora_credentials.jwt_bearer_token.is_some();
  let refresh_sentinel = !sora_credentials.sora_sentinel.is_some();

  if let Some(jwt) = &sora_credentials.jwt_bearer_token {
    let now = Utc::now();
    let refresh_deadline = now.sub(EXPIRATION_DEADLINE);
    if jwt.jwt_claims().expiration.lt(&now) {
      info!("JWT expiration time has elapsed.");
      refresh_jwt = true;
    } else if jwt.jwt_claims().expiration.lt(&refresh_deadline) {
      info!("JWT expiration time is under the expiration deadline.");
      refresh_jwt = true;
    }
  }

  let mut credential_updated = false;

  if refresh_jwt {
    let cookies = sora_credentials.cookies.as_str();
    let token = generate_bearer_jwt_with_cookie(cookies).await?;

    info!("Parsing JWT bearer token.");
    let token = SoraJwtBearerToken::new(token)?;
    sora_credentials.jwt_bearer_token = Some(token);
    credential_updated = true;
  }

  if refresh_sentinel {
    info!("Generating new sentinel...");
    let token = generate_sentinel_token().await?;
    let token = SoraSentinel::new(token);
    sora_credentials.sora_sentinel = Some(token);
    credential_updated = true;
  }

  Ok(credential_updated)
}
