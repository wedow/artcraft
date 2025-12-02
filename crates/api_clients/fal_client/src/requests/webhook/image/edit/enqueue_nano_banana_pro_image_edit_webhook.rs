use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::nano_banana_pro::nano_banana_pro_image_edit::{nano_banana_pro_image_edit, NanoBananaProImageEditInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueNanoBananaProImageEditArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_urls: Vec<String>,
  pub num_images: EnqueueNanoBananaProImageEditNumImages,

  // Optional args
  pub resolution: Option<EnqueueNanoBananaProImageEditResolution>,
  pub aspect_ratio: Option<EnqueueNanoBananaProImageEditAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBananaProImageEditNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBananaProImageEditResolution {
  OneK,
  TwoK,
  FourK,
}

/// 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
/// Default is "1:1"
#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBananaProImageEditAspectRatio {
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

pub async fn enqueue_nano_banana_pro_image_edit_webhook<R: IntoUrl>(
  args: EnqueueNanoBananaProImageEditArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    EnqueueNanoBananaProImageEditNumImages::One => 1,
    EnqueueNanoBananaProImageEditNumImages::Two => 2,
    EnqueueNanoBananaProImageEditNumImages::Three => 3,
    EnqueueNanoBananaProImageEditNumImages::Four => 4,
  };

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueNanoBananaProImageEditResolution::OneK => "1K",
        EnqueueNanoBananaProImageEditResolution::TwoK => "2K",
        EnqueueNanoBananaProImageEditResolution::FourK => "4K",
      })
      .map(|resolution| resolution.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        // Square
        EnqueueNanoBananaProImageEditAspectRatio::OneByOne => "1:1",
        // Wide
        EnqueueNanoBananaProImageEditAspectRatio::FiveByFour => "5:4",
        EnqueueNanoBananaProImageEditAspectRatio::FourByThree => "4:3",
        EnqueueNanoBananaProImageEditAspectRatio::ThreeByTwo => "3:2",
        EnqueueNanoBananaProImageEditAspectRatio::SixteenByNine => "16:9",
        EnqueueNanoBananaProImageEditAspectRatio::TwentyOneByNine => "21:9",
        // Tall
        EnqueueNanoBananaProImageEditAspectRatio::FourByFive => "4:5",
        EnqueueNanoBananaProImageEditAspectRatio::ThreeByFour => "3:4",
        EnqueueNanoBananaProImageEditAspectRatio::TwoByThree => "2:3",
        EnqueueNanoBananaProImageEditAspectRatio::NineBySixteen => "9:16",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let request = NanoBananaProImageEditInput {
    prompt: args.prompt.to_string(),
    image_urls: args.image_urls,
    num_images: Some(num_images),
    // Optionals
    aspect_ratio,
    resolution,
    // Constants
    output_format: Some("png".to_string()),
  };

  let result = nano_banana_pro_image_edit(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_nano_banana_pro_image_edit_webhook::{enqueue_nano_banana_pro_image_edit_webhook, EnqueueNanoBananaProImageEditArgs, EnqueueNanoBananaProImageEditAspectRatio, EnqueueNanoBananaProImageEditNumImages, EnqueueNanoBananaProImageEditResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueNanoBananaProImageEditArgs {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost to the image of the t-rex skeleton, make it look spooky but friendly",
      num_images: EnqueueNanoBananaProImageEditNumImages::Two,
      aspect_ratio: Some(EnqueueNanoBananaProImageEditAspectRatio::SixteenByNine),
      resolution: Some(EnqueueNanoBananaProImageEditResolution::TwoK),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_nano_banana_pro_image_edit_webhook(args).await?;

    Ok(())
  }
}
