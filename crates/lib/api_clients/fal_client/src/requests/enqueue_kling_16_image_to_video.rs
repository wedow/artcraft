use crate::creds::fal_api_key::FalApiKey;
use crate::fal_error_plus::FalErrorPlus;
use crate::model::enqueued_request::EnqueuedRequest;
use fal::endpoints::fal_ai::kling_video::v1_6::pro::image_to_video::{image_to_video, ProImageToVideoRequest};
use fal_client::file_to_base64_url::file_to_base64_url;
use futures::StreamExt;
use std::io::Write;
use std::path::Path;
use url::Url;

pub struct Kling16Args<'a, P: AsRef<Path>> {
  pub image_path: P,
  pub api_key: &'a FalApiKey,
  pub duration: Kling16Duration,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling16Duration {
  Default,
  FiveSeconds,
  TenSeconds,
}

pub async fn enqueue_kling_16_image_to_video<P: AsRef<Path>>(args: Kling16Args<'_, P>) -> Result<EnqueuedRequest, FalErrorPlus> {
  let image_url = file_to_base64_url(args.image_path)?;

  /*
  TODO: Handle error messages -
    FalError(FalError(Other("{\"detail\": \"Invalid Key Authorization header format. Expected '<key_id>:<key_secret>'.\"}")))
    FalError(FalError(Other("{\"detail\": \"No user found for Key ID and Secret\"}")))
  */

  let duration = match args.duration{
    Kling16Duration::Default => None,
    Kling16Duration::FiveSeconds => Some("5".to_string()), // Gross...
    Kling16Duration::TenSeconds => Some("10".to_string()),
  };

  let request = ProImageToVideoRequest {
    image_url,
    prompt: "".to_string(),
    aspect_ratio: None,
    cfg_scale: None,
    duration,
    negative_prompt: None,
    tail_image_url: None,
  };

  let result = image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue()
      .await?;
  
  Ok(EnqueuedRequest::from_queue_response(&result)?)
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::enqueue_kling_16_image_to_video::{enqueue_kling_16_image_to_video, Kling16Args, Kling16Duration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use testing::test_file_path::test_file_path;

  #[tokio::test]
  #[ignore]
  async fn test_kling16_video() -> AnyhowResult<()> {
    let image = test_file_path("test_data/image/juno.jpg")?;

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Kling16Args {
      image_path: image,
      api_key: &api_key,
      duration: Kling16Duration::Default,
    };

    let result = enqueue_kling_16_image_to_video(args).await?;

    Ok(())
  }
}
