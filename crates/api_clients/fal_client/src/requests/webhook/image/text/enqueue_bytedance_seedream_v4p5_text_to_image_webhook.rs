use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::bytedance::seedream::bytedance_seedream_v4p5_text_to_image::{bytedance_seedream_v4p5_text_to_image, BytedanceSeedreamV4p5TextToImageInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueBytedanceSeedreamV4p5TextToImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,

  // Optional args
  pub num_images: Option<EnqueueBytedanceSeedreamV4p5TextToImageNumImages>,
  pub max_images: Option<EnqueueBytedanceSeedreamV4p5TextToImageMaxImages>,
  pub image_size: Option<EnqueueBytedanceSeedreamV4p5TextToImageSize>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV4p5TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV4p5TextToImageMaxImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV4p5TextToImageSize {
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
  Auto2k,
  Auto4k,
}

pub async fn enqueue_bytedance_seedream_v4p5_text_to_image_webhook<R: IntoUrl>(
  args: EnqueueBytedanceSeedreamV4p5TextToImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = args.num_images
      .map(|num_images| match num_images {
        EnqueueBytedanceSeedreamV4p5TextToImageNumImages::One => 1,
        EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Two => 2,
        EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Three => 3,
        EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Four => 4,
      });

  let max_images = args.max_images
      .map(|num_images| match num_images {
        EnqueueBytedanceSeedreamV4p5TextToImageMaxImages::One => 1,
        EnqueueBytedanceSeedreamV4p5TextToImageMaxImages::Two => 2,
        EnqueueBytedanceSeedreamV4p5TextToImageMaxImages::Three => 3,
        EnqueueBytedanceSeedreamV4p5TextToImageMaxImages::Four => 4,
      });

  let image_size = args.image_size
      .map(|image_size| match image_size {
        EnqueueBytedanceSeedreamV4p5TextToImageSize::Square => "square",
        EnqueueBytedanceSeedreamV4p5TextToImageSize::SquareHd => "square_hd",
        EnqueueBytedanceSeedreamV4p5TextToImageSize::PortraitFourThree => "portrait_4_3",
        EnqueueBytedanceSeedreamV4p5TextToImageSize::PortraitSixteenNine => "portrait_16_9",
        EnqueueBytedanceSeedreamV4p5TextToImageSize::LandscapeFourThree => "landscape_4_3",
        EnqueueBytedanceSeedreamV4p5TextToImageSize::LandscapeSixteenNine => "landscape_16_9",
        EnqueueBytedanceSeedreamV4p5TextToImageSize::Auto2k => "auto_2K",
        EnqueueBytedanceSeedreamV4p5TextToImageSize::Auto4k => "auto_4K",
      })
      .map(|resolution| resolution.to_string());

  let request = BytedanceSeedreamV4p5TextToImageInput {
    prompt: args.prompt.to_string(),
    // Optionals
    num_images,
    max_images,
    image_size,
    // Constants
    enable_safety_checker: Some(false),
    seed: None,
  };

  let result = bytedance_seedream_v4p5_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_bytedance_seedream_v4p5_text_to_image_webhook::{enqueue_bytedance_seedream_v4p5_text_to_image_webhook, EnqueueBytedanceSeedreamV4p5TextToImageArgs, EnqueueBytedanceSeedreamV4p5TextToImageMaxImages, EnqueueBytedanceSeedreamV4p5TextToImageNumImages, EnqueueBytedanceSeedreamV4p5TextToImageSize};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueBytedanceSeedreamV4p5TextToImageArgs {
      prompt: "an anime girl is riding a t-rex in the forest",
      num_images: Some(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Two),
      max_images: Some(EnqueueBytedanceSeedreamV4p5TextToImageMaxImages::Two),
      image_size: Some(EnqueueBytedanceSeedreamV4p5TextToImageSize::LandscapeSixteenNine),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_bytedance_seedream_v4p5_text_to_image_webhook(args).await?;

    Ok(())
  }
}
