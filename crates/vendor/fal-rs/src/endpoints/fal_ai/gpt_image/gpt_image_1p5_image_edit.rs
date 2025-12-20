use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GptImage1p5ImageEditInput {
  pub prompt: String,

  pub image_urls: Vec<String>,

  /// The URL of the mask image to use for the generation. This indicates what part of the image to edit.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub mask_image_url: Option<String>,

  /// Eg. auto, 1024x1024, 1536x1024, 1024x1536
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// Eg. Possible enum values: auto, transparent, opaque
  #[serde(skip_serializing_if = "Option::is_none")]
  pub background: Option<String>,

  /// Eg. Possible enum values: low, medium, high
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality: Option<String>,

  /// Eg. Possible enum values: low, high
  #[serde(skip_serializing_if = "Option::is_none")]
  pub input_fidelity: Option<String>,

  /// 1 - 4
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// Possible enum values: jpeg, png, webp
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage1p5ImageEditOutput {
  pub images: Vec<ImageFile>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn gpt_image_1p5_image_edit(
  params: GptImage1p5ImageEditInput,
) -> FalRequest<GptImage1p5ImageEditInput, GptImage1p5ImageEditOutput> {
  FalRequest::new("fal-ai/gpt-image-1.5/edit", params)
}
