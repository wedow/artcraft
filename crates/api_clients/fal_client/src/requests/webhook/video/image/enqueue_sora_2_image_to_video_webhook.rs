use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::sora::sora2::sora_2_image_to_video::{sora_2_image_to_video, Sora2ImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueSora2ImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub resolution: Option<EnqueueSora2ImageToVideoResolution>,
  pub duration: Option<EnqueueSora2ImageToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueSora2ImageToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2ImageToVideoDurationSeconds {
  Four,
  Eight,
  Twelve,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2ImageToVideoResolution {
  Auto,
  SevenTwentyP,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2ImageToVideoAspectRatio {
  Auto,
  NineBySixteen,
  SixteenByNine,
}

pub async fn enqueue_sora_2_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueSora2ImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueSora2ImageToVideoDurationSeconds::Four => 4,
        EnqueueSora2ImageToVideoDurationSeconds::Eight => 8,
        EnqueueSora2ImageToVideoDurationSeconds::Twelve => 12,
      });

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueSora2ImageToVideoResolution::Auto => "auto",
        EnqueueSora2ImageToVideoResolution::SevenTwentyP => "720p",
      })
      .map(|resolution| resolution.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        EnqueueSora2ImageToVideoAspectRatio::Auto => "auto",
        EnqueueSora2ImageToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueueSora2ImageToVideoAspectRatio::SixteenByNine => "16:9",
      })
      .map(|resolution| resolution.to_string());

  let request = Sora2ImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    // Optionals
    duration,
    resolution,
    aspect_ratio,
    // Constants
    delete_video: Some(false),
  };

  let result = sora_2_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_sora_2_image_to_video_webhook::{enqueue_sora_2_image_to_video_webhook, EnqueueSora2ImageToVideoArgs, EnqueueSora2ImageToVideoAspectRatio, EnqueueSora2ImageToVideoDurationSeconds, EnqueueSora2ImageToVideoResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueSora2ImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera. the camera orbits slightly. The t-rex gets close and then bites.".to_string(),
      duration: Some(EnqueueSora2ImageToVideoDurationSeconds::Twelve),
      aspect_ratio: Some(EnqueueSora2ImageToVideoAspectRatio::SixteenByNine),
      resolution: Some(EnqueueSora2ImageToVideoResolution::SevenTwentyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_sora_2_image_to_video_webhook(args).await?;

    Ok(())
  }
}
