use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct NanoBananaProTextToImageInput {
  pub prompt: String,

  /// Eg. "16:9", "1:1", and a ton of other options. So many options.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Eg. "1K", "2K", "4K"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// 1 - 4
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// "jpeg", "png", "webp"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NanoBananaProTextToImageOutput {
  pub images: Vec<ImageFile>,
}

pub fn nano_banana_pro_text_to_image(
  params: NanoBananaProTextToImageInput,
) -> FalRequest<NanoBananaProTextToImageInput, NanoBananaProTextToImageOutput> {
  FalRequest::new("fal-ai/nano-banana-pro", params)
}
