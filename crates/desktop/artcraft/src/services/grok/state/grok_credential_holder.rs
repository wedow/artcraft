use cookie_store::cookie_store::CookieStore;
use grok_client::credentials::grok_client_secrets::GrokClientSecrets;
use grok_client::credentials::grok_full_credentials::GrokFullCredentials;
use grok_client::credentials::grok_user_data::GrokUserData;

#[derive(Clone)]
pub struct GrokCredentialHolder {
  /// Directly off the Tauri browser session.
  /// Read once, write to disk
  /// The Grok client consumes a string-only form (rather than this cookie jar)
  pub browser_cookies: Option<CookieStore>,

  /// Full credentials.
  /// NOT PERSISTED TO DISK.
  pub grok_full_credentials: Option<GrokFullCredentials>,

  /// Email, user id, etc.
  /// These can be persisted.
  pub grok_user_data: Option<GrokUserData>,

  /// These have a different lifecycle than the other pieces and are
  /// subject to change when the website changes.
  /// We won't persist these.
  pub grok_client_secrets: Option<GrokClientSecrets>,
}

impl GrokCredentialHolder {
  pub fn empty() -> Self {
    Self {
      browser_cookies: None,
      grok_full_credentials: None,
      grok_user_data: None,
      grok_client_secrets: None,
    }
  }
}
