use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::gpt_image::gpt_image_1p5_image_edit::{gpt_image_1p5_image_edit, GptImage1p5ImageEditInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueGptImage1p5EditImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_urls: Vec<String>,
  pub num_images: EnqueueGptImage1p5EditImageNumImages,

  // Optional args
  pub mask_image_url: Option<String>,
  pub image_size: Option<EnqueueGptImage1p5EditImageSize>,
  pub background: Option<EnqueueGptImage1p5EditImageBackground>,
  pub quality: Option<EnqueueGptImage1p5EditImageQuality>,
  pub input_fidelity: Option<EnqueueGptImage1p5EditImageInputFidelity>,
  pub output_format: Option<EnqueueGptImage1p5EditImageOutputFormat>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageSize {
  /// 1024x1024
  Square,
  /// 1536x1024
  Wide,
  /// 1024x1536
  Tall,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageInputFidelity {
  Low,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

pub async fn enqueue_gpt_image_1p5_image_edit_webhook<R: IntoUrl>(
  args: EnqueueGptImage1p5EditImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    EnqueueGptImage1p5EditImageNumImages::One => 1,
    EnqueueGptImage1p5EditImageNumImages::Two => 2,
    EnqueueGptImage1p5EditImageNumImages::Three => 3,
    EnqueueGptImage1p5EditImageNumImages::Four => 4,
  };

  let image_size = args.image_size
      .map(|s| match s {
        EnqueueGptImage1p5EditImageSize::Square => "1024x1024",
        EnqueueGptImage1p5EditImageSize::Wide => "1536x1024",
        EnqueueGptImage1p5EditImageSize::Tall => "1024x1536",
      })
      .map(|resolution| resolution.to_string());

  let background = args.background
      .map(|s| match s {
        EnqueueGptImage1p5EditImageBackground::Auto => "auto",
        EnqueueGptImage1p5EditImageBackground::Transparent => "transparent",
        EnqueueGptImage1p5EditImageBackground::Opaque => "opaque",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let quality = args.quality
      .map(|s| match s {
        EnqueueGptImage1p5EditImageQuality::Low => "low",
        EnqueueGptImage1p5EditImageQuality::Medium => "medium",
        EnqueueGptImage1p5EditImageQuality::High => "high",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let input_fidelity = args.input_fidelity
      .map(|s| match s {
        EnqueueGptImage1p5EditImageInputFidelity::Low => "low",
        EnqueueGptImage1p5EditImageInputFidelity::High => "high",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let output_format = args.output_format
      .map(|s| match s {
        EnqueueGptImage1p5EditImageOutputFormat::Jpeg => "jpeg",
        EnqueueGptImage1p5EditImageOutputFormat::Png => "png",
        EnqueueGptImage1p5EditImageOutputFormat::Webp => "webp",
      })
      .map(|aspect_ratio| aspect_ratio.to_string())
      .unwrap_or_else(|| "png".to_string());

  let request = GptImage1p5ImageEditInput {
    prompt: args.prompt.to_string(),
    image_urls: args.image_urls,
    num_images: Some(num_images),
    output_format: Some(output_format),
    // Optionals
    mask_image_url: args.mask_image_url,
    image_size,
    background,
    quality,
    input_fidelity,
  };

  let result = gpt_image_1p5_image_edit(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_gpt_image_1p5_edit_image_webhook::{enqueue_gpt_image_1p5_image_edit_webhook, EnqueueGptImage1p5EditImageArgs, EnqueueGptImage1p5EditImageNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueGptImage1p5EditImageArgs {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly",
      num_images: EnqueueGptImage1p5EditImageNumImages::Two,
      mask_image_url: None,
      image_size: None,
      background: None,
      quality: None,
      input_fidelity: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      output_format: None,
    };

    let result = enqueue_gpt_image_1p5_image_edit_webhook(args).await?;

    Ok(())
  }
}
