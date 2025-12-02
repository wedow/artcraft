use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct NanoBananaProTextToImageInput {
  pub prompt: String,

  /// Eg. "16:9", "1:1", and a ton of other options. So many options.
  pub aspect_ratio: String,

  /// Eg. "1K", "2K", "4K"
  pub resolution: String,

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

pub fn gemini_25_flash_image_edit(
  params: NanoBananaProTextToImageInput,
) -> FalRequest<NanoBananaProTextToImageInput, NanoBananaProTextToImageOutput> {
  FalRequest::new("fal-ai/nano-banana-pro", params)
}
