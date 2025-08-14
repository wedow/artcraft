use crate::services::midjourney::state::serializable_midjourney_state::SerializableMidjourneyUserInfo;

#[derive(Clone)]
pub struct MidjourneyUserInfo {
  pub google_email: Option<String>,
}

impl MidjourneyUserInfo {
  pub fn to_serializable(&self) -> SerializableMidjourneyUserInfo {
    SerializableMidjourneyUserInfo {
      google_email: self.google_email.clone(),
    }
  }
}
