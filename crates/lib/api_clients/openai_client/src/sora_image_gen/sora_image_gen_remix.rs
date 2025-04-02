use errors::AnyhowResult;
use crate::sora_image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::sora_image_gen::raw_sora_image_gen::{call_sora_image_gen, InpaintItem, InpaintItemType, OperationType, RawSoraImageGenRequest, VideoGenType};

pub struct SoraImageGenRemixRequest {
  pub prompt: String,
  pub num_images: NumImages,
  pub image_size: ImageSize,
  pub sora_media_tokens: Vec<String>,
  pub session_bearer_token: String,
}

pub async fn sora_image_gen_remix(request: SoraImageGenRemixRequest) -> AnyhowResult<SoraImageGenResponse> {
  let session_bearer_token = request.session_bearer_token;

  let request = RawSoraImageGenRequest {
    r#type: VideoGenType::ImageGen,
    operation: OperationType::Remix,
    prompt: request.prompt,
    n_variants: request.num_images.as_count(),
    width: request.image_size.as_width(),
    height: request.image_size.as_height(),
    n_frames: 1,
    inpaint_items: request.sora_media_tokens.into_iter().map(|token| {
      InpaintItem {
        r#type: InpaintItemType::Image,
        frame_index: 0,
        preset_id: None,
        generation_id: None,
        upload_media_id: token,
        source_start_frame: 0,
        source_end_frame: 0,
        crop_bounds: None,
      }
    }).collect(),
  };

  // TODO: Error handling.
  let result = call_sora_image_gen(request, &session_bearer_token).await?;

  Ok(SoraImageGenResponse {
    task_id: result.id,
  })
}
