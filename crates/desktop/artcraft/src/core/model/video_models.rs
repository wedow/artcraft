use serde_derive::Deserialize;

/// This is used in the Tauri command bridge. 
/// Don't change the serializations without coordinating with the frontend.
#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum VideoModel {
  #[serde(rename = "kling_1.6_pro")]
  Kling16Pro,
  
  #[serde(rename = "kling_2.1_pro")]
  Kling21Pro,
  
  #[serde(rename = "kling_2.1_master")]
  Kling21Master,
  
  #[serde(rename = "seedance_1.0_lite")]
  Seedance10Lite,
  
  #[serde(rename = "veo_2")]
  Veo2,
}
