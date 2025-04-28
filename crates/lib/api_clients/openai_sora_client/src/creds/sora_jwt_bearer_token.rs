use crate::utils::lightweight_sora_jwt_parse::{lightweight_sora_jwt_parse, SoraJwtClaims};
use errors::AnyhowResult;

/// Sora bearer tokens are JWT tokens that can be minted with a valid cookie/session.
#[derive(Clone)]
pub struct SoraJwtBearerToken {
  token: String,
  jwt_claims: SoraJwtClaims,
}

impl SoraJwtBearerToken {
  pub fn new(token: String) -> AnyhowResult<Self> {
    let jwt_claims = lightweight_sora_jwt_parse(&token)?;
    Ok(SoraJwtBearerToken {
      token,
      jwt_claims,
    })
  }

  pub fn token_str(&self) -> &str {
    &self.token
  }

  pub fn as_bytes(&self) -> &[u8] {
    self.token.as_bytes()
  }

  pub fn jwt_claims(&self) -> &SoraJwtClaims {
    &self.jwt_claims
  }

  pub fn to_authorization_header_value(&self) -> String {
    match self.token.get(0..6) {
      Some("bearer") | Some("Bearer") => self.token.clone(),
      _ => "Bearer ".to_owned() + &self.token,
    }
  }
}
