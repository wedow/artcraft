use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::sora_error::SoraError;

pub struct SoraCredentialBuilder {
  cookies: Option<String>,
  jwt_bearer_token: Option<String>,
  sora_sentinel: Option<String>,
}

impl SoraCredentialBuilder {
  pub fn new() -> Self {
    SoraCredentialBuilder {
      cookies: None,
      jwt_bearer_token: None,
      sora_sentinel: None,
    }
  }
  
  pub fn cookies(mut self, cookies: &str) -> Self {
    self.cookies = Some(cookies.to_string());
    self
  }
  
  pub fn jwt_bearer_token(mut self, token: &str) -> Self {
    self.jwt_bearer_token = Some(token.to_string());
    self
  }
  
  pub fn sora_sentinel(mut self, sentinel: &str) -> Self {
    self.sora_sentinel = Some(sentinel.to_string());
    self
  }
  
  pub fn build(self) -> Result<SoraCredentialSet, SoraError> {
    use crate::creds::sora_cookies::SoraCookies;
    use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
    use crate::creds::sora_sentinel::SoraSentinel;

    let cookies = match self.cookies {
      Some(c) => SoraCookies::new(c),
      None => return Err(SoraError::SoraCredentialBuilderError("no cookies provided".to_string())),
    };

    let jwt_bearer_token = match self.jwt_bearer_token {
      Some(t) => Some(SoraJwtBearerToken::new(t)?),
      None => None,
    };

    let sora_sentinel = match self.sora_sentinel {
      Some(s) => Some(SoraSentinel::new(s)),
      None => None,
    };

    Ok(SoraCredentialSet {
      cookies,
      jwt_bearer_token,
      sora_sentinel,
    })
  }
}
