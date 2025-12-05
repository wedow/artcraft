use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::veo::veo3_1::veo_3p1_first_frame_image_to_video::{veo_3p1_first_frame_image_to_video, Veo3p1FirstFrameImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueVeo3p1ImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Starting frame
  pub image_url: String,

  // Optional args
  pub duration: Option<EnqueueVeo3p1ImageToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueVeo3p1ImageToVideoAspectRatio>,
  pub resolution: Option<EnqueueVeo3p1ImageToVideoResolution>,
  pub generate_audio: Option<bool>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueVeo3p1ImageToVideoDurationSeconds {
  Four,
  Six,
  Eight,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueVeo3p1ImageToVideoAspectRatio {
  Auto,
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueVeo3p1ImageToVideoResolution {
  SevenTwentyP,
  TenEightyP,
}

pub async fn enqueue_veo_3p1_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueVeo3p1ImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueVeo3p1ImageToVideoDurationSeconds::Four => "4s",
        EnqueueVeo3p1ImageToVideoDurationSeconds::Six => "6s",
        EnqueueVeo3p1ImageToVideoDurationSeconds::Eight=> "8s",
      })
      .map(|s| s.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        EnqueueVeo3p1ImageToVideoAspectRatio::Auto => "auto",
        EnqueueVeo3p1ImageToVideoAspectRatio::Square => "1:1",
        EnqueueVeo3p1ImageToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueVeo3p1ImageToVideoAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueVeo3p1ImageToVideoResolution::SevenTwentyP => "720p",
        EnqueueVeo3p1ImageToVideoResolution::TenEightyP => "1080p",
      })
      .map(|s| s.to_string());

  let request = Veo3p1FirstFrameImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    generate_audio: args.generate_audio,
    // Optionals
    duration,
    aspect_ratio,
    resolution,
  };

  let result = veo_3p1_first_frame_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_veo_3p1_image_to_video_webhook::{enqueue_veo_3p1_image_to_video_webhook, EnqueueVeo3p1ImageToVideoArgs, EnqueueVeo3p1ImageToVideoAspectRatio, EnqueueVeo3p1ImageToVideoDurationSeconds, EnqueueVeo3p1ImageToVideoResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TALL_CORGI_SHIBA_TREASURE_OCEAN_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueVeo3p1ImageToVideoArgs {
      image_url: TALL_CORGI_SHIBA_TREASURE_OCEAN_URL.to_string(),
      prompt: "There is a tiny ocean island with a corgi and shiba and treasure chest on it. The corgi and shiba are barking at the chest, when suddenly the island launches itself into the air. The camera tracks the island and follows it up high in the sky. The sun beams over the horizon. The dogs are happy and bark. The gold coins gleam in the sun.".to_string(),
      duration: Some(EnqueueVeo3p1ImageToVideoDurationSeconds::Eight),
      aspect_ratio: Some(EnqueueVeo3p1ImageToVideoAspectRatio::NineBySixteen),
      resolution: Some(EnqueueVeo3p1ImageToVideoResolution::TenEightyP),
      generate_audio: Some(true),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_3p1_image_to_video_webhook(args).await?;

    Ok(())
  }
}
