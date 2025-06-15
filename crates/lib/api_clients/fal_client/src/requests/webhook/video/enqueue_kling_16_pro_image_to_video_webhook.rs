use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::kling_video::v1_6::pro::image_to_video::{image_to_video, ProImageToVideoRequest};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Kling16ProArgs<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub webhook_url: V,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub duration: Kling16Duration,
  pub aspect_ratio: Kling16ProAspectRatio,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling16Duration {
  Default,
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling16ProAspectRatio {
  Square, // 1:1
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

pub async fn enqueue_kling_16_pro_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Kling16ProArgs<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Kling16Duration::Default => None,
    Kling16Duration::FiveSeconds => Some("5".to_string()), // Gross...
    Kling16Duration::TenSeconds => Some("10".to_string()),
  };
  
  let aspect_ratio = match args.aspect_ratio {
    Kling16ProAspectRatio::Square => Some("1:1".to_string()),
    Kling16ProAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Kling16ProAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = ProImageToVideoRequest {
    image_url,
    prompt: args.prompt.to_string(),
    aspect_ratio,
    duration,
    // Maybe expose these later
    cfg_scale: None,
    negative_prompt: None,
    tail_image_url: None,
  };

  let result = image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

/*
#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::enqueue_kling_16_image_to_video_webhook::{enqueue_kling_16_image_to_video_webhook, Kling16Args, Kling16Duration};
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
      prompt: "a corgi looks out over the water",
      api_key: &api_key,
      duration: Kling16Duration::Default,
    };

    let result = enqueue_kling_16_image_to_video_webhook(args).await?;

    Ok(())
  }
}
*/