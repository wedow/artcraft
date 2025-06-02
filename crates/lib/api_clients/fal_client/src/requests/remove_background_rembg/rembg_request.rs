use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::imageutils::rembg::{rembg, RemoveBackgroundInput};

pub (super) async fn rembg_request(image_url: String, api_key: &FalApiKey) -> Result<(), FalErrorPlus> {

  let request = RemoveBackgroundInput {
    image_url,
    crop_to_bbox: None,
    sync_mode: None
  };

  let result = rembg(request)
      .with_client()
      .with_api_key(&api_key.0)
      .queue()
      .await;

  let result = match result {
    Ok(result) => result,
    Err(err) => return Err(classify_fal_error(err)),
  };
  
  println!("{:?}", result.payload);
  
  Ok(())
}
