use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::veo2::image_to_video::image_to_video;
use fal::endpoints::fal_ai::veo2::image_to_video::ImageToVideoInput;
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Veo2Args<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub webhook_url: V,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub duration: Veo2Duration,
  pub aspect_ratio: Veo2AspectRatio,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo2Duration {
  Default,
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo2AspectRatio {
  Auto,
  AutoPreferPortrait,
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

pub async fn enqueue_veo_2_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Veo2Args<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Veo2Duration::Default => None,
    Veo2Duration::FiveSeconds => Some("5".to_string()),
    Veo2Duration::SixSeconds => Some("6".to_string()),
    Veo2Duration::SevenSeconds => Some("7".to_string()),
    Veo2Duration::EightSeconds => Some("8".to_string()),
  };
  
  let aspect_ratio = match args.aspect_ratio {
    Veo2AspectRatio::Auto => Some("auto".to_string()),
    Veo2AspectRatio::AutoPreferPortrait => Some("auto_prefer_portrait".to_string()),
    Veo2AspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Veo2AspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = ImageToVideoInput {
    image_url,
    prompt: args.prompt.to_string(),
    aspect_ratio,
    duration,
    // Maybe expose these later
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
  use crate::requests::webhook::video::enqueue_veo_2_image_to_video_webhook::{enqueue_veo_2_image_to_video_webhook, Veo2Args, Veo2AspectRatio, Veo2Duration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test_kling21_pro_video() -> AnyhowResult<()> {
    let image_url = "https://cdn-2.fakeyou.com/media/3/4/h/f/s/34hfsmt8e38rvne6mwa4pwbxr6292sgy/image_34hfsmt8e38rvne6mwa4pwbxr6292sgy.png";

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Veo2Args {
      image_url: image_url,
      prompt: "a shot of the mountains as the sun sets and reveals the moon and stars",
      api_key: &api_key,
      duration: Veo2Duration::Default,
      aspect_ratio: Veo2AspectRatio::WideSixteenNine,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_2_image_to_video_webhook(args).await?;

    Ok(())
  }
}
