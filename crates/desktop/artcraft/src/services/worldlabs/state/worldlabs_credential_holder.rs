use cookie_store::cookie_store::CookieStore;
use grok_client::credentials::grok_full_credentials::GrokFullCredentials;

#[derive(Clone)]
pub struct WorldlabsCredentialHolder {
  /// Directly off the Tauri browser session.
  /// Read once, write to disk
  /// The Worldlabs client consumes a string-only form (rather than this cookie jar)
  pub browser_cookies: Option<CookieStore>,

  /// Full credentials.
  /// NOT PERSISTED TO DISK.
  pub worldlabs_full_credentials: Option<GrokFullCredentials>,
}

impl WorldlabsCredentialHolder {
  pub fn empty() -> Self {
    Self {
      browser_cookies: None,
      worldlabs_full_credentials: None,
    }
  }
}
