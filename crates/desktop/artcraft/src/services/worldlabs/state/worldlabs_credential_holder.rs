use cookie_store::cookie_store::CookieStore;
use world_labs_client::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use world_labs_client::credentials::world_labs_cookies::WorldLabsCookies;

#[derive(Clone)]
pub struct WorldlabsCredentialHolder {
  /// Directly off the Tauri browser session.
  /// Read once, write to disk
  /// The Worldlabs client consumes a string-only form (rather than this cookie jar)
  pub browser_cookies: Option<CookieStore>,

  /// Copy of cookies, specifically for the client library.
  /// NOT PERSISTED TO DISK.
  pub world_labs_cookies: Option<WorldLabsCookies>,

  /// Bearer token
  /// This needs to be persisted to disk.
  pub world_labs_bearer_token: Option<WorldLabsBearerToken>,
}

impl WorldlabsCredentialHolder {
  pub fn empty() -> Self {
    Self {
      browser_cookies: None,
      world_labs_cookies: None,
      world_labs_bearer_token: None,
    }
  }
}
