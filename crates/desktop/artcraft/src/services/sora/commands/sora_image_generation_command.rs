use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::sora::state::read_sora_credentials_from_disk::read_sora_credentials_from_disk;
use crate::services::sora::state::sora_credential_holder::SoraCredentialHolder;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use errors::AnyhowResult;
use log::{error, info};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use openai_sora_client::requests::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
use openai_sora_client::requests::upload::upload_media_from_bytes::sora_media_upload_from_bytes;
use std::time::Duration;
use tauri::{AppHandle, State};

const SORA_IMAGE_UPLOAD_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

const SORA_IMAGE_REMIX_TIMEOUT: Duration = Duration::from_millis(1000 * 30); // 30 seconds

#[tauri::command]
pub async fn sora_image_generation_command(
  prompt: &str,
  image: Option<&str>,
  _app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  sora_creds_holder: State<'_, SoraCredentialHolder>,
) -> Result<String, String> {
  info!("image_generation_command called; processing image...");

  generate_image(image, prompt, &app_data_root, &sora_creds_holder)
    .await
    .map_err(|err| {
      error!("error: {:?}", err);
      "there was an error".to_string()
    })?;

  Ok("success".to_string())
}

pub async fn generate_image(
  maybe_image: Option<&str>,
  prompt: &str,
  app_data_root: &AppDataRoot,
  sora_creds_holder: &SoraCredentialHolder,
) -> AnyhowResult<()> {

  let creds = read_sora_credentials_from_disk(app_data_root)
      .map_err(|err| {
        error!("Failed to read Sora credentials from disk: {:?}", err);
        err
      })?;

  let mut sora_media_tokens = vec![];

  if let Some(image) = maybe_image {
    let image_bytes = BASE64_STANDARD.decode(image)?;

    let filename = "image.png".to_string();
    

    let response = sora_media_upload_from_bytes(
      image_bytes, 
      filename, 
      &creds,
      Some(SORA_IMAGE_UPLOAD_TIMEOUT))
        .await
        .map_err(|err| {
          error!("Failed to upload image to Sora: {:?}", err);
          err
        })?;

    sora_media_tokens.push(response.id);
  }

  let response = sora_image_gen_remix(SoraImageGenRemixRequest {
    prompt: prompt.to_string(),
    num_images: NumImages::One,
    image_size: ImageSize::Square,
    sora_media_tokens: sora_media_tokens.clone(),
    credentials: &creds,
    request_timeout: Some(SORA_IMAGE_REMIX_TIMEOUT),
  }).await
      .map_err(|err| {
        error!("Failed to call Sora image generation: {:?}", err);
        err
      })?;

  println!(">> TASK ID: {:?} ", response.task_id);

  Ok(())
}
