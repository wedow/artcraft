use std::fs::read_to_string;
use cookie_store::serialized_cookie_store::SerializableCookieStore;
use serde_derive::{Deserialize, Serialize};
use crate::core::state::data_dir::app_data_root::AppDataRoot;

pub (super) const SERIALIZABLE_GROK_STATE_VERSION: u32 = 1;

#[derive(Serialize, Deserialize)]
pub (super) struct GrokSerializableState {
  pub (super) version: u32,
  
  #[serde(skip_serializing_if = "Option::is_none")]
  pub (super) user_cookies: Option<SerializableCookieStore>,
  
  //#[serde(skip_serializing_if = "Option::is_none")]
  //pub (super) user_info: Option<SerializableMidjourneyUserInfo>,
}

//#[derive(Serialize, Deserialize)]
//pub (super) struct SerializableMidjourneyUserInfo {
//  #[serde(skip_serializing_if = "Option::is_none")]
//  pub (super) user_id: Option<String>,
//  
//  #[serde(skip_serializing_if = "Option::is_none")]
//  pub (super) email: Option<String>,
//
//  #[serde(skip_serializing_if = "Option::is_none")]
//  pub (super) websocket_token: Option<String>,
//}

//impl SerializableMidjourneyUserInfo {
//  pub fn to_user_info(&self) -> MidjourneyUserInfo {
//    MidjourneyUserInfo {
//      user_id: self.user_id
//          .as_deref()
//          .map(|id| MidjourneyUserId::from_str(id)),
//      email: self.email.clone(),
//      websocket_token: self.websocket_token.clone(),
//    }
//  }
//}


impl GrokSerializableState {
  pub fn read_from_disk(root: &AppDataRoot) -> anyhow::Result<Option<GrokSerializableState>> {
    let midjourney_state_path= root.credentials_dir().get_grok_state_path();

    if !midjourney_state_path.exists() {
      return Ok(None);
    }

    let contents = read_to_string(&midjourney_state_path)?
        .trim()
        .to_string();

    let state: GrokSerializableState = serde_json::from_str(&contents)?;

    Ok(Some(state))
  }
}