use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;
use fal::endpoints::fal_ai::sora::sora2::sora_2_pro_text_to_video::{sora_2_pro_text_to_video, Sora2ProTextToVideoInput};

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
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use crate::requests::webhook::video::text::enqueue_sora_2_pro_text_to_video_webhook::{enqueue_sora_2_pro_text_to_video_webhook, EnqueueSora2ProTextToVideoArgs, EnqueueSora2ProTextToVideoAspectRatio, EnqueueSora2ProTextToVideoDurationSeconds, EnqueueSora2ProTextToVideoResolution};

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
