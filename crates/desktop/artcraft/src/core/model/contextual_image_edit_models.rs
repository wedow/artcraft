use serde_derive::Deserialize;

/// This is used in the Tauri command bridge. 
/// Don't change the serializations without coordinating with the frontend.
#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ContextualImageEditModel {
  #[serde(rename = "gpt_image_1")]
  GptImage1,

  #[serde(rename = "flux_pro_kontext_max")]
  FluxProKontextMax,
  
  // TODO: Flux Kontext models.
}
