use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::imageutils::rembg::{rembg, RemoveBackgroundInput};
use fal::webhook::WebhookResponse;

pub async fn rembg_request(image_url: String, api_key: &FalApiKey) -> Result<WebhookResponse, FalErrorPlus> {

  let request = RemoveBackgroundInput {
    image_url,
    crop_to_bbox: None,
    sync_mode: None
  };

  let result = rembg(request)
      .with_api_key(&api_key.0)
      .queue_webhook("https://api.storyteller.ai/webhook")
      .await;

  let result = match result {
    Ok(result) => result,
    Err(err) => return Err(classify_fal_error(err)),
  };
  
  println!("{:?}", result);
  
  Ok(result)
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::remove_background_rembg::rembg_request::rembg_request;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore] // NB: Manually test, don't run in CI!
  async fn test_rembg_request() -> anyhow::Result<()> {
    // XXX: Don't commit secrets!
    let api_key = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&api_key);
    
    let response = rembg_request("test_data/juno.jpg".into(), &api_key).await?;
    
    
    assert_eq!(1, 2);
    
    Ok(())
  }
}
