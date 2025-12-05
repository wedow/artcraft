use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::nano_banana_pro::nano_banana_pro_text_to_image::{nano_banana_pro_text_to_image, NanoBananaProTextToImageInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueNanoBananaProTextToImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub num_images: EnqueueNanoBananaProTextToImageNumImages,

  // Optional args
  pub resolution: Option<EnqueueNanoBananaProTextToImageResolution>,
  pub aspect_ratio: Option<EnqueueNanoBananaProTextToImageAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBananaProTextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBananaProTextToImageResolution {
  OneK,
  TwoK,
  FourK,
}

/// 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
/// Default is "1:1"
#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBananaProTextToImageAspectRatio {
  // Square
  OneByOne,
  // Wide
  FiveByFour,
  FourByThree,
  ThreeByTwo,
  SixteenByNine,
  TwentyOneByNine,
  // Tall
  FourByFive,
  ThreeByFour,
  TwoByThree,
  NineBySixteen, // NB: No NineByTwentyOne ?
}

pub async fn enqueue_nano_banana_pro_text_to_image_webhook<R: IntoUrl>(
  args: EnqueueNanoBananaProTextToImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    EnqueueNanoBananaProTextToImageNumImages::One => 1,
    EnqueueNanoBananaProTextToImageNumImages::Two => 2,
    EnqueueNanoBananaProTextToImageNumImages::Three => 3,
    EnqueueNanoBananaProTextToImageNumImages::Four => 4,
  };

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueNanoBananaProTextToImageResolution::OneK => "1K",
        EnqueueNanoBananaProTextToImageResolution::TwoK => "2K",
        EnqueueNanoBananaProTextToImageResolution::FourK => "4K",
      })
      .map(|resolution| resolution.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        // Square
        EnqueueNanoBananaProTextToImageAspectRatio::OneByOne => "1:1",
        // Wide
        EnqueueNanoBananaProTextToImageAspectRatio::FiveByFour => "5:4",
        EnqueueNanoBananaProTextToImageAspectRatio::FourByThree => "4:3",
        EnqueueNanoBananaProTextToImageAspectRatio::ThreeByTwo => "3:2",
        EnqueueNanoBananaProTextToImageAspectRatio::SixteenByNine => "16:9",
        EnqueueNanoBananaProTextToImageAspectRatio::TwentyOneByNine => "21:9",
        // Tall
        EnqueueNanoBananaProTextToImageAspectRatio::FourByFive => "4:5",
        EnqueueNanoBananaProTextToImageAspectRatio::ThreeByFour => "3:4",
        EnqueueNanoBananaProTextToImageAspectRatio::TwoByThree => "2:3",
        EnqueueNanoBananaProTextToImageAspectRatio::NineBySixteen => "9:16",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let request = NanoBananaProTextToImageInput {
    prompt: args.prompt.to_string(),
    num_images: Some(num_images),
    // Optionals
    aspect_ratio,
    resolution,
    // Constants
    output_format: Some("png".to_string()),
  };

  let result = nano_banana_pro_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_nano_banana_pro_text_to_image_webhook::{enqueue_nano_banana_pro_text_to_image_webhook, EnqueueNanoBananaProTextToImageArgs, EnqueueNanoBananaProTextToImageAspectRatio, EnqueueNanoBananaProTextToImageNumImages, EnqueueNanoBananaProTextToImageResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueNanoBananaProTextToImageArgs {
      prompt: "an anime girl riding on the back of a t-rex",
      num_images: EnqueueNanoBananaProTextToImageNumImages::One,
      aspect_ratio: Some(EnqueueNanoBananaProTextToImageAspectRatio::SixteenByNine),
      resolution: Some(EnqueueNanoBananaProTextToImageResolution::TwoK),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_nano_banana_pro_text_to_image_webhook(args).await?;

    Ok(())
  }
}
