use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BytedanceSeedreamV4TextToImageInput {
  pub prompt: String,

  /// Supports a custom height/width (which we didn't implement) OR an enum value -
  /// square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9, auto, auto_2K, auto_4K
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// Number of generations
  /// 1 - 4
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// 1 - 4
  /// If set to a number greater than one, enables multi-image generation.
  /// The model will potentially return up to max_images images every generation,
  /// and in total, num_images generations will be carried out. In total, the number
  /// of images generated will be between num_images and max_images*num_images.
  /// Default value: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub max_images: Option<u8>,

  /// Possible enum values: standard, fast (default "standard")
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enhance_prompt_mode: Option<String>,

  /// Defaults to true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BytedanceSeedreamV4TextToImageOutput {
  pub images: Vec<ImageFile>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn bytedance_seedream_v4_text_to_image(
  params: BytedanceSeedreamV4TextToImageInput,
) -> FalRequest<BytedanceSeedreamV4TextToImageInput, BytedanceSeedreamV4TextToImageOutput> {
  FalRequest::new("fal-ai/bytedance/seedream/v4/text-to-image", params)
}
