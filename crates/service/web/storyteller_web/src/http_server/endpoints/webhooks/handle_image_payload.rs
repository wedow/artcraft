use anyhow::anyhow;
use log::info;
use serde_json::{Map, Value};
use errors::AnyhowResult;

#[derive(Deserialize, Debug)]
pub struct FalWebhookImage {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub height: Option<usize>,
  pub width: Option<usize>,
  pub url: Option<String>,
}

pub async fn handle_image_payload(
  payload: &Map<String, Value>, 
) -> AnyhowResult<()> {
  
  let image_value = payload.get("image")
      .ok_or_else(|| anyhow!("no `image` key in payload"))?;
  
  let image: FalWebhookImage = serde_json::from_value(image_value.clone())?;
  
  info!("Image payload received: {:?}", image);
  
  Ok(())
}
