use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::kling_video::v2_1::pro::image_to_video::{image_to_video, ProImageToVideoRequest};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Kling21ProArgs<'a, U: IntoUrl, T: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub end_frame_image_url: Option<T>,
  pub webhook_url: V,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub duration: Kling21ProDuration,
  pub aspect_ratio: Kling21ProAspectRatio,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling21ProDuration {
  Default,
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling21ProAspectRatio {
  Square, // 1:1
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

pub async fn enqueue_kling_21_pro_image_to_video_webhook<U: IntoUrl, T: IntoUrl, V: IntoUrl>(
  args: Kling21ProArgs<'_, U, T, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Kling21ProDuration::Default => None,
    Kling21ProDuration::FiveSeconds => Some("5".to_string()), // Gross...
    Kling21ProDuration::TenSeconds => Some("10".to_string()),
  };
  
  let aspect_ratio = match args.aspect_ratio {
    Kling21ProAspectRatio::Square => Some("1:1".to_string()),
    Kling21ProAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Kling21ProAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let tail_image_url = args.end_frame_image_url
      .map(|url| url.as_str().to_string());

  let request = ProImageToVideoRequest {
    image_url,
    prompt: args.prompt.to_string(),
    tail_image_url,
    aspect_ratio,
    duration,
    // Maybe expose these later
    cfg_scale: None,
    negative_prompt: None,
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
  use crate::requests::webhook::video::enqueue_kling_21_pro_image_to_video_webhook::{enqueue_kling_21_pro_image_to_video_webhook, Kling21ProArgs, Kling21ProAspectRatio, Kling21ProDuration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, SUPER_WIDE_FALL_MOUNTAINS_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Kling21ProArgs {
      image_url: SUPER_WIDE_FALL_MOUNTAINS_IMAGE_URL,
      end_frame_image_url: Some(JUNO_AT_LAKE_IMAGE_URL.to_string()),
      prompt: "a shot of the mountains, the camera pulls back to show a corgi waiting to jump into the lake",
      api_key: &api_key,
      duration: Kling21ProDuration::Default,
      aspect_ratio: Kling21ProAspectRatio::WideSixteenNine,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_21_pro_image_to_video_webhook(args).await?;

    Ok(())
  }
}
