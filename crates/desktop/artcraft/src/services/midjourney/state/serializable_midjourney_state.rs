use cookie_store::serialized_cookie_store::SerializableCookieStore;
use serde_derive::{Deserialize, Serialize};
use crate::services::midjourney::state::midjourney_user_info::MidjourneyUserInfo;

#[derive(Serialize, Deserialize)]
pub (super) struct SerializableMidjourneyState {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) user_cookies: Option<SerializableCookieStore>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) user_info: Option<SerializableMidjourneyUserInfo>,
}

#[derive(Serialize, Deserialize)]
pub (super) struct SerializableMidjourneyUserInfo {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) google_email: Option<String>,
}

impl SerializableMidjourneyUserInfo {
  pub fn to_user_info(&self) -> MidjourneyUserInfo {
    MidjourneyUserInfo {
      google_email: self.google_email.clone(),
    }
  }
}
