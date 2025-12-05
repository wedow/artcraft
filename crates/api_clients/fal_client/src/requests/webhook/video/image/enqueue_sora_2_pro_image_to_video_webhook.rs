use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::sora::sora2::sora_2_pro_image_to_video::{sora_2_pro_image_to_video, Sora2ProImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueSora2ProImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub resolution: Option<EnqueueSora2ProImageToVideoResolution>,
  pub duration: Option<EnqueueSora2ProImageToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueSora2ProImageToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2ProImageToVideoDurationSeconds {
  Four,
  Eight,
  Twelve,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2ProImageToVideoResolution {
  Auto,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2ProImageToVideoAspectRatio {
  Auto,
  NineBySixteen,
  SixteenByNine,
}

pub async fn enqueue_sora_2_pro_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueSora2ProImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueSora2ProImageToVideoDurationSeconds::Four => 4,
        EnqueueSora2ProImageToVideoDurationSeconds::Eight => 8,
        EnqueueSora2ProImageToVideoDurationSeconds::Twelve => 12,
      });

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueSora2ProImageToVideoResolution::Auto => "auto",
        EnqueueSora2ProImageToVideoResolution::SevenTwentyP => "720p",
        EnqueueSora2ProImageToVideoResolution::TenEightyP => "1080p",
      })
      .map(|resolution| resolution.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        EnqueueSora2ProImageToVideoAspectRatio::Auto => "auto",
        EnqueueSora2ProImageToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueueSora2ProImageToVideoAspectRatio::SixteenByNine => "16:9",
      })
      .map(|resolution| resolution.to_string());

  let request = Sora2ProImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    // Optionals
    duration,
    resolution,
    aspect_ratio,
    // Constants
    delete_video: Some(false),
  };

  let result = sora_2_pro_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_sora_2_pro_image_to_video_webhook::{enqueue_sora_2_pro_image_to_video_webhook, EnqueueSora2ProImageToVideoArgs, EnqueueSora2ProImageToVideoAspectRatio, EnqueueSora2ProImageToVideoDurationSeconds, EnqueueSora2ProImageToVideoResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueSora2ProImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera. the camera orbits slightly. The t-rex gets close and then bites.".to_string(),
      duration: Some(EnqueueSora2ProImageToVideoDurationSeconds::Twelve),
      aspect_ratio: Some(EnqueueSora2ProImageToVideoAspectRatio::SixteenByNine),
      resolution: Some(EnqueueSora2ProImageToVideoResolution::TenEightyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_sora_2_pro_image_to_video_webhook(args).await?;

    Ok(())
  }
}
