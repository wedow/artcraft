use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::bytedance::seedream::bytedance_seedream_v4_text_to_image::BytedanceSeedreamV4TextToImageInput;
use fal::prelude::fal_ai::bytedance::seedream::bytedance_seedream_v4_text_to_image::bytedance_seedream_v4_text_to_image;
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueBytedanceSeedreamV4TextToImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,

  // Optional args
  pub num_images: Option<EnqueueBytedanceSeedreamV4TextToImageNumImages>,
  pub max_images: Option<EnqueueBytedanceSeedreamV4TextToImageMaxImages>,
  pub image_size: Option<EnqueueBytedanceSeedreamV4TextToImageSize>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV4TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV4TextToImageMaxImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV4TextToImageSize {
  // Square
  Square,
  SquareHd,
  // Tall
  PortraitFourThree,
  PortraitSixteenNine,
  // Wide
  LandscapeFourThree,
  LandscapeSixteenNine,
  // Auto
  Auto,
  Auto2k,
  Auto4k,
}

pub async fn enqueue_bytedance_seedream_v4_text_to_image_webhook<R: IntoUrl>(
  args: EnqueueBytedanceSeedreamV4TextToImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = args.num_images
      .map(|num_images| match num_images {
        EnqueueBytedanceSeedreamV4TextToImageNumImages::One => 1,
        EnqueueBytedanceSeedreamV4TextToImageNumImages::Two => 2,
        EnqueueBytedanceSeedreamV4TextToImageNumImages::Three => 3,
        EnqueueBytedanceSeedreamV4TextToImageNumImages::Four => 4,
      });

  let max_images = args.max_images
      .map(|num_images| match num_images {
        EnqueueBytedanceSeedreamV4TextToImageMaxImages::One => 1,
        EnqueueBytedanceSeedreamV4TextToImageMaxImages::Two => 2,
        EnqueueBytedanceSeedreamV4TextToImageMaxImages::Three => 3,
        EnqueueBytedanceSeedreamV4TextToImageMaxImages::Four => 4,
      });

  let image_size = args.image_size
      .map(|image_size| match image_size {
        EnqueueBytedanceSeedreamV4TextToImageSize::Square => "square",
        EnqueueBytedanceSeedreamV4TextToImageSize::SquareHd => "square_hd",
        EnqueueBytedanceSeedreamV4TextToImageSize::PortraitFourThree => "portrait_4_3",
        EnqueueBytedanceSeedreamV4TextToImageSize::PortraitSixteenNine => "portrait_16_9",
        EnqueueBytedanceSeedreamV4TextToImageSize::LandscapeFourThree => "landscape_4_3",
        EnqueueBytedanceSeedreamV4TextToImageSize::LandscapeSixteenNine => "landscape_16_9",
        EnqueueBytedanceSeedreamV4TextToImageSize::Auto => "auto",
        EnqueueBytedanceSeedreamV4TextToImageSize::Auto2k => "auto_2K",
        EnqueueBytedanceSeedreamV4TextToImageSize::Auto4k => "auto_4K",
      })
      .map(|resolution| resolution.to_string());

  let request = BytedanceSeedreamV4TextToImageInput {
    prompt: args.prompt.to_string(),
    // Optionals
    num_images,
    max_images,
    image_size,
    // Constants
    enhance_prompt_mode: Some("standard".to_string()),
    enable_safety_checker: Some(false),
  };

  let result = bytedance_seedream_v4_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_bytedance_seedream_v4_text_to_image_webhook::{enqueue_bytedance_seedream_v4_text_to_image_webhook, EnqueueBytedanceSeedreamV4TextToImageArgs, EnqueueBytedanceSeedreamV4TextToImageMaxImages, EnqueueBytedanceSeedreamV4TextToImageNumImages, EnqueueBytedanceSeedreamV4TextToImageSize};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueBytedanceSeedreamV4TextToImageArgs {
      prompt: "an anime girl is riding a t-rex in the forest",
      num_images: Some(EnqueueBytedanceSeedreamV4TextToImageNumImages::Two),
      max_images: Some(EnqueueBytedanceSeedreamV4TextToImageMaxImages::Two),
      image_size: Some(EnqueueBytedanceSeedreamV4TextToImageSize::LandscapeSixteenNine),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_bytedance_seedream_v4_text_to_image_webhook(args).await?;

    Ok(())
  }
}
