use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::sora::sora2::sora_2_text_to_video::{sora_2_text_to_video, Sora2TextToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueSora2TextToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Optional args
  pub resolution: Option<EnqueueSora2TextToVideoResolution>,
  pub duration: Option<EnqueueSora2TextToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueSora2TextToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2TextToVideoDurationSeconds {
  Four,
  Eight,
  Twelve,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2TextToVideoResolution {
  Auto,
  SevenTwentyP,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueSora2TextToVideoAspectRatio {
  Auto,
  NineBySixteen,
  SixteenByNine,
}

pub async fn enqueue_sora_2_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueSora2TextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueSora2TextToVideoDurationSeconds::Four => 4,
        EnqueueSora2TextToVideoDurationSeconds::Eight => 8,
        EnqueueSora2TextToVideoDurationSeconds::Twelve => 12,
      });

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueSora2TextToVideoResolution::Auto => "auto",
        EnqueueSora2TextToVideoResolution::SevenTwentyP => "720p",
      })
      .map(|resolution| resolution.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        EnqueueSora2TextToVideoAspectRatio::Auto => "auto",
        EnqueueSora2TextToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueueSora2TextToVideoAspectRatio::SixteenByNine => "16:9",
      })
      .map(|resolution| resolution.to_string());

  let request = Sora2TextToVideoInput {
    prompt: args.prompt,
    // Optionals
    duration,
    resolution,
    aspect_ratio,
    // Constants
    delete_video: Some(false),
  };

  let result = sora_2_text_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::text::enqueue_sora_2_text_to_video_webhook::{enqueue_sora_2_text_to_video_webhook, EnqueueSora2TextToVideoArgs, EnqueueSora2TextToVideoAspectRatio, EnqueueSora2TextToVideoDurationSeconds, EnqueueSora2TextToVideoResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueSora2TextToVideoArgs {
      prompt: "a dinosaur turns to the camera and asks, 'do you have adequate car insurance?' it then stomps off and attacks a brontosaurus".to_string(),
      duration: Some(EnqueueSora2TextToVideoDurationSeconds::Eight),
      aspect_ratio: Some(EnqueueSora2TextToVideoAspectRatio::NineBySixteen),
      resolution: Some(EnqueueSora2TextToVideoResolution::SevenTwentyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_sora_2_text_to_video_webhook(args).await?;

    Ok(())
  }
}
