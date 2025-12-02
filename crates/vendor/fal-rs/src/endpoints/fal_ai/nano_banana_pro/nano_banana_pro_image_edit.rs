use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct NanoBananaProImageEditInput {
  pub prompt: String,

  pub image_urls: Vec<String>,

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

/*
{
  "prompt": "make a photo of the man driving the car down the california coastline",
  "num_images": 3,
  "aspect_ratio": "16:9",
  "output_format": "png",
  "image_urls": [
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
  ],
  "resolution": "1K"
}
 */

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
  /// The URL where the file can be downloaded from.
  pub url: String,

  // /// The mime type of the file.
  // /// "image/png"
  // #[serde(skip_serializing_if = "Option::is_none")]
  // pub content_type: Option<String>,
  // /// File data
  // #[serde(skip_serializing_if = "Option::is_none")]
  // pub file_data: Option<String>,
  // /// The name of the file. It will be auto-generated if not provided.
  // /// "z9RV14K95DvU.png"
  // #[serde(skip_serializing_if = "Option::is_none")]
  // pub file_name: Option<String>,
  // /// The size of the file in bytes.
  // /// 4404019
  // #[serde(skip_serializing_if = "Option::is_none")]
  // pub file_size: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Gemini25FlashImageEditOutput {
  pub images: Vec<File>,
}

pub fn gemini_25_flash_image_edit(
  params: Gemini25FlashImageEditInput,
) -> FalRequest<Gemini25FlashImageEditInput, Gemini25FlashImageEditOutput> {
  FalRequest::new("fal-ai/gemini-25-flash-image/edit", params)
}
