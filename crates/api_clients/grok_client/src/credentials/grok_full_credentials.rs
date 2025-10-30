use crate::credentials::grok_cookies::GrokCookies;
use crate::datatypes::user_email::UserEmail;
use crate::datatypes::user_id::UserId;

/// Includes the cookies and all the magic other bits needed to call the API.
#[derive(Clone)]
pub struct GrokFullCredentials {
  pub cookies: GrokCookies,
  
  /// From index.html
  pub user_email: Option<UserEmail>,
  
  /// From index.html
  pub user_id: Option<UserId>,
}
