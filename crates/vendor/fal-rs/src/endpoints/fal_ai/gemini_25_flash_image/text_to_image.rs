use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Gemini25FlashTextToImageInput {
  pub prompt: String,

  /// 1 - 4
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// "jpeg" or "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  /// The aspect ratio of the generated image.
  /// Default value: "1:1"
  /// Possible enum values: 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Gemini25FlashTextToImageOutput {
  pub images: Vec<File>,
}

pub fn gemini_25_flash_text_to_image(
  params: Gemini25FlashTextToImageInput,
) -> FalRequest<Gemini25FlashTextToImageInput, Gemini25FlashTextToImageOutput> {
  FalRequest::new("fal-ai/gemini-25-flash-image", params)
}
