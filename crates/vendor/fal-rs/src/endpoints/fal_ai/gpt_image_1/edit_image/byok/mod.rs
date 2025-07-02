use crate::prelude::{Deserialize, FalRequest, Serialize};

//gpt-image-1/edit-image/byok

/*
{
  "image_urls": [
    "https://storage.googleapis.com/falserverless/model_tests/gpt-image-1/cyberpunk.png",
    {
      "path": "assets_client_upload_media_4b47499df0289be2bf9a3ce9a4bf469a422642ad_media_01jwegn8zsew0a68em7m87fbf4.png"
    }
  ],
  "prompt": "Make this pixel-art style.",
  "image_size": "1024x1024",
  "num_images": 1,
  "quality": "high",
  "openai_api_key": "key"
}
*/

#[derive(Debug, Serialize, Deserialize)]
pub struct GptEditImageRequest {
  /// The context images
  pub image_urls: Vec<String>,

  /// The prompt
  pub prompt: String,

  pub image_size: String,
  
  pub num_images: u8,

  pub quality: String,
  
  pub openai_api_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageOutput {
}

pub fn gpt_edit_image(params: GptEditImageRequest) -> FalRequest<GptEditImageRequest, ImageOutput> {
  FalRequest::new("fal-ai/gpt-image-1/edit-image/byok", params)
}
