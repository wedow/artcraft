use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct NanoBananaProImageEditInput {
  pub prompt: String,

  pub image_urls: Vec<String>,

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
pub struct ImageFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NanoBananaProImageEditOutput {
  pub images: Vec<ImageFile>,
}

pub fn nano_banana_pro_image_edit(
  params: NanoBananaProImageEditInput,
) -> FalRequest<NanoBananaProImageEditInput, NanoBananaProImageEditOutput> {
  FalRequest::new("fal-ai/nano-banana-pro/edit", params)
}
