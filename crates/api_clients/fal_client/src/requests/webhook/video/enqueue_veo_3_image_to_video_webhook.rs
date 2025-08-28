use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::veo3::image_to_video::{image_to_video, ImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Veo3Args<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub prompt: &'a str,
  pub duration: Veo3Duration,
  pub aspect_ratio: Veo3AspectRatio,
  pub resolution: Veo3Resolution,
  pub generate_audio: bool,
  pub api_key: &'a FalApiKey,
  pub webhook_url: V,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3Duration {
  Default,
  EightSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3AspectRatio {
  Default,
  WideSixteenNine,
  TallNineSixteen,
  Square,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3Resolution {
  Default,
  SevenTwentyP,
  TenEightyP,
}

pub async fn enqueue_veo_3_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Veo3Args<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Veo3Duration::Default => None,
    Veo3Duration::EightSeconds => Some("8s".to_string()),
  };

  let aspect_ratio = match args.aspect_ratio {
    Veo3AspectRatio::Default => None,
    Veo3AspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Veo3AspectRatio::TallNineSixteen => Some("9:16".to_string()),
    Veo3AspectRatio::Square => Some("1:1".to_string()),
  };
  
  let resolution= match args.resolution {
    Veo3Resolution::Default => None,
    Veo3Resolution::SevenTwentyP => Some("720p".to_string()),
    Veo3Resolution::TenEightyP => Some("1080p".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = ImageToVideoInput {
    image_url,
    prompt: args.prompt.to_string(),
    aspect_ratio,
    resolution,
    duration,
    generate_audio: Some(args.generate_audio),
  };

  let result = image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::enqueue_veo_3_image_to_video_webhook::{enqueue_veo_3_image_to_video_webhook, Veo3Args, Veo3AspectRatio, Veo3Duration, Veo3Resolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Veo3Args {
      image_url: TREX_SKELETON_IMAGE_URL,
      prompt: "the t-rex skeleton starts walking towards the camera and roars",
      api_key: &api_key,
      duration: Veo3Duration::EightSeconds,
      aspect_ratio: Veo3AspectRatio::WideSixteenNine,
      resolution: Veo3Resolution::TenEightyP,
      generate_audio: true,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_3_image_to_video_webhook(args).await?;

    Ok(())
  }
}
