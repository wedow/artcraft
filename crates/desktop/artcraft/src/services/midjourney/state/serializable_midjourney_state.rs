use cookie_store::serialized_cookie_store::SerializableCookieStore;
use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub (super) struct SerializableMidjourneyState {
  pub (super) user_cookies: Option<SerializableCookieStore>,
  pub (super) user_info: Option<SerializableMidjourneyUserInfo>,
}

#[derive(Serialize, Deserialize)]
pub (super) struct SerializableMidjourneyUserInfo {
  pub (super) google_email: Option<String>,
}
