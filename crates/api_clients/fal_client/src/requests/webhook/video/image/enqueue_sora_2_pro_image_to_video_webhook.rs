use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
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

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueSora2ProImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "If an OpenAI API key is provided, it will be directly charged by OpenAI.
    //  Otherwise, you will be charged fal credits.
    //  The pricing is $0.30/s for 720p and $0.50/s for 1080p."
    // NB(bt): There's no way to provide an API key with this endpoint?

    let duration = self.duration.unwrap_or(EnqueueSora2ProImageToVideoDurationSeconds::Four);
    let resolution = self.resolution.unwrap_or(EnqueueSora2ProImageToVideoResolution::Auto); // WHAT IS THIS?!

    match (duration, resolution) {
      (EnqueueSora2ProImageToVideoDurationSeconds::Four, EnqueueSora2ProImageToVideoResolution::Auto) => 120, // TODO: Auto = ???
      (EnqueueSora2ProImageToVideoDurationSeconds::Four, EnqueueSora2ProImageToVideoResolution::SevenTwentyP) => 120,
      (EnqueueSora2ProImageToVideoDurationSeconds::Four, EnqueueSora2ProImageToVideoResolution::TenEightyP) => 200,
      (EnqueueSora2ProImageToVideoDurationSeconds::Eight, EnqueueSora2ProImageToVideoResolution::Auto) => 240, // TODO: Auto = ???
      (EnqueueSora2ProImageToVideoDurationSeconds::Eight, EnqueueSora2ProImageToVideoResolution::SevenTwentyP) => 240,
      (EnqueueSora2ProImageToVideoDurationSeconds::Eight, EnqueueSora2ProImageToVideoResolution::TenEightyP) => 400,
      (EnqueueSora2ProImageToVideoDurationSeconds::Twelve, EnqueueSora2ProImageToVideoResolution::Auto) => 360, // TODO: Auto = ???
      (EnqueueSora2ProImageToVideoDurationSeconds::Twelve, EnqueueSora2ProImageToVideoResolution::SevenTwentyP) => 360,
      (EnqueueSora2ProImageToVideoDurationSeconds::Twelve, EnqueueSora2ProImageToVideoResolution::TenEightyP) => 600,
    }
  }
}


/// Sora 2 Pro Image-to-Video
/// https://fal.ai/models/fal-ai/sora-2/image-to-video/pro
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
