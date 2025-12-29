use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use fal::endpoints::fal_ai::sora::sora2::sora_2_pro_text_to_video::{sora_2_pro_text_to_video, Sora2ProTextToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueSora2ProTextToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Optional args
  pub resolution: Option<EnqueueSora2ProTextToVideoResolution>,
  pub duration: Option<EnqueueSora2ProTextToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueSora2ProTextToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2ProTextToVideoDurationSeconds {
  Four,
  Eight,
  Twelve,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2ProTextToVideoResolution {
  Auto,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2ProTextToVideoAspectRatio {
  Auto,
  NineBySixteen,
  SixteenByNine,
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueSora2ProTextToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "If an OpenAI API key is provided, it will be directly charged by OpenAI.
    //  Otherwise, you will be charged fal credits.
    //  The pricing is $0.30/s for 720p and $0.50/s for 1080p."
    // NB(bt): There's no way to provide an API key with this endpoint?

    let duration = self.duration.unwrap_or(EnqueueSora2ProTextToVideoDurationSeconds::Four);
    let resolution = self.resolution.unwrap_or(EnqueueSora2ProTextToVideoResolution::Auto); // WHAT IS THIS?!

    match (duration, resolution) {
      (EnqueueSora2ProTextToVideoDurationSeconds::Four, EnqueueSora2ProTextToVideoResolution::Auto) => 120, // TODO: Auto = ???
      (EnqueueSora2ProTextToVideoDurationSeconds::Four, EnqueueSora2ProTextToVideoResolution::SevenTwentyP) => 120,
      (EnqueueSora2ProTextToVideoDurationSeconds::Four, EnqueueSora2ProTextToVideoResolution::TenEightyP) => 200,
      (EnqueueSora2ProTextToVideoDurationSeconds::Eight, EnqueueSora2ProTextToVideoResolution::Auto) => 240, // TODO: Auto = ???
      (EnqueueSora2ProTextToVideoDurationSeconds::Eight, EnqueueSora2ProTextToVideoResolution::SevenTwentyP) => 240,
      (EnqueueSora2ProTextToVideoDurationSeconds::Eight, EnqueueSora2ProTextToVideoResolution::TenEightyP) => 400,
      (EnqueueSora2ProTextToVideoDurationSeconds::Twelve, EnqueueSora2ProTextToVideoResolution::Auto) => 360, // TODO: Auto = ???
      (EnqueueSora2ProTextToVideoDurationSeconds::Twelve, EnqueueSora2ProTextToVideoResolution::SevenTwentyP) => 360,
      (EnqueueSora2ProTextToVideoDurationSeconds::Twelve, EnqueueSora2ProTextToVideoResolution::TenEightyP) => 600,
    }
  }
}


/// Sora 2 Pro Text-to-Video
/// https://fal.ai/models/fal-ai/sora-2/text-to-video/pro
pub async fn enqueue_sora_2_pro_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueSora2ProTextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueSora2ProTextToVideoDurationSeconds::Four => 4,
        EnqueueSora2ProTextToVideoDurationSeconds::Eight => 8,
        EnqueueSora2ProTextToVideoDurationSeconds::Twelve => 12,
      });

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueSora2ProTextToVideoResolution::Auto => "auto",
        EnqueueSora2ProTextToVideoResolution::SevenTwentyP => "720p",
        EnqueueSora2ProTextToVideoResolution::TenEightyP => "1080p",
      })
      .map(|resolution| resolution.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        EnqueueSora2ProTextToVideoAspectRatio::Auto => "auto",
        EnqueueSora2ProTextToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueueSora2ProTextToVideoAspectRatio::SixteenByNine => "16:9",
      })
      .map(|resolution| resolution.to_string());

  let request = Sora2ProTextToVideoInput {
    prompt: args.prompt,
    // Optionals
    duration,
    resolution,
    aspect_ratio,
    // Constants
    delete_video: Some(false),
  };

  let result = sora_2_pro_text_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::text::enqueue_sora_2_pro_text_to_video_webhook::{enqueue_sora_2_pro_text_to_video_webhook, EnqueueSora2ProTextToVideoArgs, EnqueueSora2ProTextToVideoAspectRatio, EnqueueSora2ProTextToVideoDurationSeconds, EnqueueSora2ProTextToVideoResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueSora2ProTextToVideoArgs {
      prompt: "a dinosaur turns to the camera and asks, 'do you have adequate car insurance?' it then stomps off and attacks a brontosaurus".to_string(),
      duration: Some(EnqueueSora2ProTextToVideoDurationSeconds::Eight),
      aspect_ratio: Some(EnqueueSora2ProTextToVideoAspectRatio::NineBySixteen),
      resolution: Some(EnqueueSora2ProTextToVideoResolution::SevenTwentyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_sora_2_pro_text_to_video_webhook(args).await?;

    Ok(())
  }
}
