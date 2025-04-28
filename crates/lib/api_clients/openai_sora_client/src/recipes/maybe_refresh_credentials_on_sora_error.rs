use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::requests::bearer::generate::generate_bearer_with_cookie;
use crate::sora_error::SoraError;
use anyhow::anyhow;
use log::{error, info, warn};

// TODO: Make other APIs work with this.

pub async fn maybe_refresh_credentials_on_sora_error(creds: &SoraCredentialSet, error: SoraError) -> Result<SoraCredentialSet, SoraError> {

  match error {
    SoraError::NoBearerTokenAvailable => {
      warn!("Previous request failed due to missing bearer token.");
    }
    SoraError::UnauthorizedCookieOrBearerExpired => {
      warn!("Previous request failed due to invalid bearer token.");
    }
    _ => {
      error!("Previous request failed with error: {:?}", error);
      return Err(SoraError::OtherBadStatus(anyhow!("previous request failed with error: {:?}", error)))
    }
  }

  info!("Generating new JWT bearer token...");

  let cookies = creds.cookies.as_str();
  let response = generate_bearer_with_cookie(cookies).await;

  let new_bearer = match response {
    Err(err) => {
      return Err(SoraError::OtherBadStatus(anyhow!("failed to generate new JWT bearer token: {:?}", err)))
    }
    Ok(bearer) => {
      match SoraJwtBearerToken::new(bearer) {
        Err(err) => {
          return Err(SoraError::OtherBadStatus(anyhow!("failed to parse new JWT bearer token: {:?}", err)));
        }
        Ok(bearer) => bearer,
      }
    }
  };

  let mut new_creds = creds.clone();

  new_creds.jwt_bearer_token = Some(new_bearer);

  Ok(new_creds)
}
