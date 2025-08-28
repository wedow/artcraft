use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::bytedance::seedance::v1::pro::image_to_video::{seedance_v1_pro_image_to_video, SeedanceImageToVideoProRequest};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Seedance1ProArgs<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub webhook_url: V,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub camera_fixed: bool,
  pub duration: Seedance1ProDuration,
  pub resolution: Seedance1ProResolution,
  pub seed: Option<u32>,
}

#[derive(Copy, Clone, Debug)]
pub enum Seedance1ProDuration {
  ThreeSeconds,
  FourSeconds,
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
  NineSeconds,
  TenSeconds,
  ElevenSeconds,
  TwelveSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Seedance1ProResolution {
  FourEightyP, // 480p
  SevenTwentyP, // 720p
  TenEightyP, // 1080p
}

pub async fn enqueue_seedance_1_pro_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Seedance1ProArgs<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Seedance1ProDuration::ThreeSeconds => Some("3".to_string()),
    Seedance1ProDuration::FourSeconds => Some("4".to_string()),
    Seedance1ProDuration::FiveSeconds => Some("5".to_string()),
    Seedance1ProDuration::SixSeconds => Some("6".to_string()),
    Seedance1ProDuration::SevenSeconds => Some("7".to_string()),
    Seedance1ProDuration::EightSeconds => Some("8".to_string()),
    Seedance1ProDuration::NineSeconds => Some("9".to_string()), 
    Seedance1ProDuration::TenSeconds => Some("10".to_string()),
    Seedance1ProDuration::ElevenSeconds => Some("11".to_string()),
    Seedance1ProDuration::TwelveSeconds => Some("12".to_string()),
  };
  
  let resolution = match args.resolution {
    Seedance1ProResolution::FourEightyP => Some("480p".to_string()),
    Seedance1ProResolution::SevenTwentyP => Some("720p".to_string()),
    Seedance1ProResolution::TenEightyP => Some("1080p".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = SeedanceImageToVideoProRequest {
    image_url,
    prompt: args.prompt.to_string(),
    duration,
    resolution,
    // TODO: Add these later
    camera_fixed: None,
    // Static
    enable_safety_checker: Some(false),
  };

  let result = seedance_v1_pro_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::enqueue_seedance_1_pro_image_to_video_webhook::{enqueue_seedance_1_pro_image_to_video_webhook, Seedance1ProArgs, Seedance1ProDuration, Seedance1ProResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TALL_MOCHI_WITH_GLASSES_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Seedance1ProArgs {
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL,
      prompt: "shiba in glasses runs to the lake and stands by the shore",
      api_key: &api_key,
      camera_fixed: false,
      duration: Seedance1ProDuration::FiveSeconds,
      resolution: Seedance1ProResolution::SevenTwentyP,
      seed: None,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_seedance_1_pro_image_to_video_webhook(args).await?;

    Ok(())
  }
}
