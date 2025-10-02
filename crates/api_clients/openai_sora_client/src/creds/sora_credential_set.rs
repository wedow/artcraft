use crate::creds::sora_cookies::SoraCookies;
use crate::creds::sora_credential_builder::SoraCredentialBuilder;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::creds::sora_sentinel::SoraSentinel;

#[derive(Clone)]
pub struct SoraCredentialSet {
  pub cookies: SoraCookies,
  pub jwt_bearer_token: Option<SoraJwtBearerToken>,
  pub sora_sentinel: Option<SoraSentinel>,
}

impl SoraCredentialSet {
  pub fn initialize(
    cookies: SoraCookies,
    bearer: Option<SoraJwtBearerToken>,
    sentinel: Option<SoraSentinel>
  ) -> Self {
    Self {
      cookies,
      jwt_bearer_token: bearer,
      sora_sentinel: sentinel,
    }
  }

  pub fn initialize_with_just_cookies(cookies: SoraCookies) -> Self {
    SoraCredentialSet {
      cookies,
      jwt_bearer_token: None,
      sora_sentinel: None,
    }
  }

  pub fn initialize_with_just_cookies_str(cookies: &str) -> Self {
    Self::initialize_with_just_cookies(
      SoraCookies::new(cookies.to_string()),
    )
  }
  
  pub fn to_builder(&self) -> SoraCredentialBuilder {
    let mut builder = SoraCredentialBuilder::new()
        .with_cookies(self.cookies.as_str());
    if let Some(bearer) = &self.jwt_bearer_token {
      builder = builder.with_jwt_bearer_token(bearer.as_str());
    }
    if let Some(sentinel) = &self.sora_sentinel {
      builder = builder.with_sora_sentinel(sentinel.as_str());
    }
    builder
  }
}
