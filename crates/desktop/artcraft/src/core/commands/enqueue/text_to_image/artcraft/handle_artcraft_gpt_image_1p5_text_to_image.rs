use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageQuality, EditImageSize};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen::{GptImage1p5MultiFunctionImageGenNumImages, GptImage1p5MultiFunctionImageGenQuality, GptImage1p5MultiFunctionImageGenRequest, GptImage1p5MultiFunctionImageGenSize};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use std::time::Duration;
use storyteller_client::endpoints::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen_image::gpt_image_1p5_multi_function_image_gen;
use tauri::AppHandle;

pub async fn handle_artcraft_gpt_image_1p5_text_to_image(
  request: &EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(GenerateError::needs_storyteller_credentials());
    },
  };

  info!("Calling Artcraft gpt-image-1.5 ...");

  let uuid_idempotency_token = generate_random_uuid();

  let image_size = request.aspect_ratio
      .map(|size| match size {
        TextToImageSize::Auto => GptImage1p5MultiFunctionImageGenSize::Square,
        TextToImageSize::Square => GptImage1p5MultiFunctionImageGenSize::Square,
        TextToImageSize::Tall => GptImage1p5MultiFunctionImageGenSize::Tall,
        TextToImageSize::Wide => GptImage1p5MultiFunctionImageGenSize::Wide,
      });

  let num_images = match request.number_images {
    None => None,
    Some(1) => Some(GptImage1p5MultiFunctionImageGenNumImages::One),
    Some(2) => Some(GptImage1p5MultiFunctionImageGenNumImages::Two),
    Some(3) => Some(GptImage1p5MultiFunctionImageGenNumImages::Three),
    Some(4) => Some(GptImage1p5MultiFunctionImageGenNumImages::Four),
    // TODO: Error
    //Some(other) => {
    //  return Err(InternalImageError::InvalidNumberOfRequestedImages {
    //    min: 1,
    //    max: 4,
    //    requested: other,
    //  });
    //},
    _ => Some(GptImage1p5MultiFunctionImageGenNumImages::One), // Default to one image if invalid number
  };

  let request = GptImage1p5MultiFunctionImageGenRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    image_size,
    num_images,
    // Not provided for text-to-image
    image_media_tokens: None,
    mask_image_token: None,
    input_fidelity: None,
    // Not provided
    output_format: None,
    background: None,
    quality: None,
  };

  let result = gpt_image_1p5_multi_function_image_gen(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;

  let job_id = match result {
    Ok(enqueued) => {
      info!("Successfully enqueued Artcraft gpt-image-1.5. Job token: {}", 
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft gpt-image-1.5: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::GptImage1p5),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}
