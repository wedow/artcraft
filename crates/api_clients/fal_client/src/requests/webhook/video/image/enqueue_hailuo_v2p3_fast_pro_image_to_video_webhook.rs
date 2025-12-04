use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::minimax::hailuo::hailuo_v2p3_fast_pro_image_to_video::{hailuo_v2p3_fast_pro_image_to_video, HailuoV2p3FastProImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueHailuoV2p3FastProImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub prompt_optimizer: Option<bool>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

pub async fn enqueue_hailuo_v2p3_fast_pro_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueHailuoV2p3FastProImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let prompt_optimizer = args.prompt_optimizer.unwrap_or(true);

  let request = HailuoV2p3FastProImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    // Optionals
    prompt_optimizer: Some(prompt_optimizer),
  };

  let result = hailuo_v2p3_fast_pro_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_hailuo_v2p3_fast_pro_image_to_video_webhook::{enqueue_hailuo_v2p3_fast_pro_image_to_video_webhook, EnqueueHailuoV2p3FastProImageToVideoArgs};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueHailuoV2p3FastProImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera. the camera orbits slightly. The t-rex gets close and then bites.".to_string(),
      prompt_optimizer: Some(true),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_hailuo_v2p3_fast_pro_image_to_video_webhook(args).await?;

    Ok(())
  }
}
