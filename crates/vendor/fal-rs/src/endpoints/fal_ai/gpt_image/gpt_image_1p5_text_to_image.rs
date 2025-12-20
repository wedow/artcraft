use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GptImage1p5TextToImageInput {
  pub prompt: String,

  /// Eg. auto, 1024x1024, 1536x1024, 1024x1536
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// Eg. Possible enum values: auto, transparent, opaque
  #[serde(skip_serializing_if = "Option::is_none")]
  pub background: Option<String>,

  /// Eg. Possible enum values: low, medium, high
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality: Option<String>,

  /// 1 - 4
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// Possible enum values: jpeg, png, webp
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage1p5TextToImageOutput {
  pub images: Vec<ImageFile>,
}

pub fn gpt_image_1p5_text_to_image(
  params: GptImage1p5TextToImageInput,
) -> FalRequest<GptImage1p5TextToImageInput, GptImage1p5TextToImageOutput> {
  FalRequest::new("fal-ai/gpt-image-1.5", params)
}
