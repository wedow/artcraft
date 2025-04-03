use errors::AnyhowResult;
use crate::credentials::SoraCredentials;
use crate::image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::image_gen::raw_sora_image_gen::{call_sora_image_gen, OperationType, RawSoraImageGenRequest, VideoGenType};

pub struct SoraImageGenSimpleRequest<'a> {
  pub prompt: String,
  pub num_images: NumImages,
  pub image_size: ImageSize,
  pub credentials: &'a SoraCredentials,
}

pub async fn sora_image_gen_simple(request: SoraImageGenSimpleRequest<'_>) -> AnyhowResult<SoraImageGenResponse> {
  let args = RawSoraImageGenRequest {
    r#type: VideoGenType::ImageGen,
    operation: OperationType::SimpleCompose,
    prompt: request.prompt,
    n_variants: request.num_images.as_count(),
    width: request.image_size.as_width(),
    height: request.image_size.as_height(),
    n_frames: 1,
    inpaint_items: vec![],
  };

  // TODO: Error handling.
  let result = call_sora_image_gen(args, request.credentials).await?;

  Ok(SoraImageGenResponse {
    task_id: result.id,
  })
}

#[cfg(test)]
mod tests {
  use std::fs::read_to_string;
  use errors::AnyhowResult;
  use testing::test_file_path::test_file_path;
  use crate::credentials::SoraCredentials;
  use crate::image_gen::common::{ImageSize, NumImages};
  use crate::image_gen::sora_image_gen_simple::{sora_image_gen_simple, SoraImageGenSimpleRequest};

  #[ignore]
  #[tokio::test]
  pub async fn test() -> AnyhowResult<()> {
    let sentinel = read_to_string(test_file_path("test_data/temp/sentinel.txt")?)?;
    let sentinel = sentinel.trim().to_string();

    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let creds = SoraCredentials {
      bearer_token: bearer,
      cookie,
      sentinel,
    };

    let response = sora_image_gen_simple(SoraImageGenSimpleRequest {
      prompt: "A toy F-22 fighter jet attacks a toy giant monster".to_string(),
      num_images: NumImages::One,
      image_size: ImageSize::Square,
      credentials: &creds,
    }).await?;

    println!("task_id: {}", response.task_id);

    assert!(response.task_id.starts_with("task_"));
    Ok(())
  }
}