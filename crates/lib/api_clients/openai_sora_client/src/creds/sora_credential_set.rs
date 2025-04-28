use anyhow::anyhow;
use errors::AnyhowResult;
use crate::credentials::SoraCredentials;
use crate::creds::sora_cookies::SoraCookies;
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

  // TODO(bt,2025-04-23): Just here for migration
  pub fn from_legacy_credentials(credentials: &SoraCredentials) -> AnyhowResult<Self> {
    let cookies = SoraCookies::new(credentials.cookie.clone());
    let jwt_bearer_token = SoraJwtBearerToken::new(credentials.bearer_token.clone())?;
    let mut sora_sentinel = None;

    if let Some(sentinel) = &credentials.sentinel {
      sora_sentinel = Some(SoraSentinel::new(sentinel.clone()));
    }

    Ok(SoraCredentialSet {
      cookies,
      jwt_bearer_token: Some(jwt_bearer_token),
      sora_sentinel,
    })
  }

  pub fn to_legacy_credentials(&self) -> AnyhowResult<SoraCredentials> {
    let bearer_token= self.jwt_bearer_token
        .as_ref()
        .map(|token| token.token_str().to_string())
        .ok_or_else(|| anyhow!("There is no bearer token to convert to a required legacy bearer token"))?;

    let sentinel = self.sora_sentinel
        .as_ref()
        .map(|sentinel| sentinel.get_sentinel().to_string());

    Ok(SoraCredentials {
      cookie: self.cookies.as_str().to_string(),
      bearer_token,
      sentinel,
    })
  }
}