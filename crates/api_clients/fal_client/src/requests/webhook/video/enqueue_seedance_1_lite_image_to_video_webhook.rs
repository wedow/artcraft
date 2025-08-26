use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::bytedance::seedance::v1::lite::image_to_video::image_to_video;
use fal::endpoints::fal_ai::bytedance::seedance::v1::lite::image_to_video::ImageToVideoRequest;
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Seedance1LiteArgs<'a, U: IntoUrl, T: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub end_frame_image_url: Option<T>,
  pub webhook_url: V,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub camera_fixed: bool,
  pub duration: Seedance1LiteDuration,
  pub resolution: Seedance1LiteResolution,
  pub seed: Option<u32>,
}

#[derive(Copy, Clone, Debug)]
pub enum Seedance1LiteDuration {
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Seedance1LiteResolution {
  FourEightyP, // 480p
  SevenTwentyP, // 720p
}

pub async fn enqueue_seedance_1_lite_image_to_video_webhook<U: IntoUrl, T: IntoUrl, V: IntoUrl>(
  args: Seedance1LiteArgs<'_, U, T, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Seedance1LiteDuration::FiveSeconds => Some("5".to_string()),
    Seedance1LiteDuration::TenSeconds => Some("10".to_string()),
  };
  
  let resolution = match args.resolution {
    Seedance1LiteResolution::FourEightyP => Some("480p".to_string()),
    Seedance1LiteResolution::SevenTwentyP => Some("720p".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let end_image_url = args.end_frame_image_url
      .map(|url| url.as_str().to_string());

  let request = ImageToVideoRequest {
    image_url,
    end_image_url,
    prompt: args.prompt.to_string(),
    duration,
    resolution,
    // TODO: Add these later
    camera_fixed: None,
    seed: -1,
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
  use crate::requests::webhook::video::enqueue_seedance_1_lite_image_to_video_webhook::{enqueue_seedance_1_lite_image_to_video_webhook, Seedance1LiteArgs, Seedance1LiteDuration, Seedance1LiteResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Seedance1LiteArgs {
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL,
      end_frame_image_url: Some(JUNO_AT_LAKE_IMAGE_URL.to_string()),
      prompt: "shiba in glasses runs to the lake and stands by the shore",
      api_key: &api_key,
      camera_fixed: false,
      duration: Seedance1LiteDuration::FiveSeconds,
      resolution: Seedance1LiteResolution::SevenTwentyP,
      seed: None,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_seedance_1_lite_image_to_video_webhook(args).await?;

    Ok(())
  }
}
