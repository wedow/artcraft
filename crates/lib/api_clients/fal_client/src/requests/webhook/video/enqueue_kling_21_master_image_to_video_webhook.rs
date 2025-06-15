use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::kling_video::v2_1::master::image_to_video::{image_to_video, MasterImageToVideoRequest};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Kling21MasterArgs<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub webhook_url: V,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub duration: Kling21MasterDuration,
  pub aspect_ratio: Kling21MasterAspectRatio,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling21MasterDuration {
  Default,
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling21MasterAspectRatio {
  Square, // 1:1
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

pub async fn enqueue_kling_21_master_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Kling21MasterArgs<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Kling21MasterDuration::Default => None,
    Kling21MasterDuration::FiveSeconds => Some("5".to_string()), // Gross...
    Kling21MasterDuration::TenSeconds => Some("10".to_string()),
  };
  
  let aspect_ratio = match args.aspect_ratio {
    Kling21MasterAspectRatio::Square => Some("1:1".to_string()),
    Kling21MasterAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Kling21MasterAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = MasterImageToVideoRequest {
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


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::enqueue_kling_21_master_image_to_video_webhook::{enqueue_kling_21_master_image_to_video_webhook, Kling21MasterArgs, Kling21MasterAspectRatio, Kling21MasterDuration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test_kling21_master_video() -> AnyhowResult<()> {
    let image_url = "https://cdn-2.fakeyou.com/media/3/4/h/f/s/34hfsmt8e38rvne6mwa4pwbxr6292sgy/image_34hfsmt8e38rvne6mwa4pwbxr6292sgy.png";

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Kling21MasterArgs {
      image_url: image_url,
      prompt: "a shot of the mountains, the camera rotates around to show the mountain range, the sun begins to set, and the moon becomes visible",
      api_key: &api_key,
      duration: Kling21MasterDuration::Default,
      aspect_ratio: Kling21MasterAspectRatio::WideSixteenNine,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_21_master_image_to_video_webhook(args).await?;

    Ok(())
  }
}
