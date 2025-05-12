use crate::creds::credential_migration::CredentialMigrationRef;
use crate::requests::image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::requests::image_gen::image_gen_http_request::{image_gen_http_request, OperationType, RawSoraImageGenRequest, VideoGenType};
use errors::AnyhowResult;
use std::time::Duration;

pub struct SoraImageGenSimpleRequest<'a> {
  pub prompt: String,
  pub num_images: NumImages,
  pub image_size: ImageSize,
  pub credentials: CredentialMigrationRef<'a>,
  pub request_timeout: Option<Duration>,
}

pub async fn sora_image_gen_simple(args: SoraImageGenSimpleRequest<'_>) -> AnyhowResult<SoraImageGenResponse> {
  let sora_request = RawSoraImageGenRequest {
    r#type: VideoGenType::ImageGen,
    operation: OperationType::SimpleCompose,
    prompt: args.prompt,
    n_variants: args.num_images.as_count(),
    width: args.image_size.as_width(),
    height: args.image_size.as_height(),
    n_frames: 1,
    inpaint_items: vec![],
  };

  // TODO: Error handling.
  let result = image_gen_http_request(sora_request, args.credentials, args.request_timeout).await?;

  Ok(SoraImageGenResponse {
    task_id: result.id,
  })
}

#[cfg(test)]
mod tests {
  use crate::credentials::SoraCredentials;
  use crate::creds::credential_migration::CredentialMigrationRef;
  use crate::requests::image_gen::common::{ImageSize, NumImages};
  use crate::requests::image_gen::sora_image_gen_simple::{sora_image_gen_simple, SoraImageGenSimpleRequest};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use testing::test_file_path::test_file_path;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let sentinel = read_to_string(test_file_path("test_data/temp/sentinel.txt")?)?;
    let sentinel = sentinel.trim().to_string();

    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let creds = SoraCredentials {
      bearer_token: bearer,
      cookie,
      sentinel: Some(sentinel),
    };

    let response = sora_image_gen_simple(SoraImageGenSimpleRequest {
      prompt: "A pirate and a ninja fight in a battle inside a UFO. Fully photo realistic, lifelike, lens flare".to_string(),
      num_images: NumImages::One,
      image_size: ImageSize::Square,
      credentials: CredentialMigrationRef::Legacy(&creds),
      request_timeout: None,
    }).await?;

    println!("task_id: {}", response.task_id);

    assert!(response.task_id.0.starts_with("task_"));
    Ok(())
  }
}