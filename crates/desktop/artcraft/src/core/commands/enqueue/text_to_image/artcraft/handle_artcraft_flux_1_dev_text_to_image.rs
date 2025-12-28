use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::{GenerateFlux1DevTextToImageAspectRatio, GenerateFlux1DevTextToImageNumImages, GenerateFlux1DevTextToImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};
use idempotency::uuid::generate_random_uuid;
use storyteller_client::endpoints::generate::image::generate_flux_1_dev_text_to_image::generate_flux_1_dev_text_to_image;

pub async fn handle_artcraft_flux_1_dev_text_to_image(
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

  info!("enqueue Flux 1 Dev");
  
  let uuid_idempotency_token = generate_random_uuid();

  let request = GenerateFlux1DevTextToImageRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    aspect_ratio: request.aspect_ratio
        .map(|aspect| match aspect {
          // TODO(bt,2025-07-14): Support other aspect ratios.
          TextToImageSize::Tall => GenerateFlux1DevTextToImageAspectRatio::PortraitNineBySixteen,
          TextToImageSize::Wide => GenerateFlux1DevTextToImageAspectRatio::LandscapeSixteenByNine,
          TextToImageSize::Auto => GenerateFlux1DevTextToImageAspectRatio::SquareHd,
          TextToImageSize::Square => GenerateFlux1DevTextToImageAspectRatio::SquareHd,
        }),
    num_images: request.number_images
        .and_then(|num| match num {
          1 => Some(GenerateFlux1DevTextToImageNumImages::One),
          2 => Some(GenerateFlux1DevTextToImageNumImages::Two),
          3 => Some(GenerateFlux1DevTextToImageNumImages::Three),
          4 => Some(GenerateFlux1DevTextToImageNumImages::Four),
          _ => None, // NB: use service defaults
        }),
  };

  let result = generate_flux_1_dev_text_to_image(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;

  let job_token = match result {
    Ok(enqueued) => {
      info!("Successfully enqueued Artcraft Flux 1 Dev text to image generation");
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft Flux 1 Dev text to image generation: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    task_type: TaskType::ImageGeneration,
    model: Some(GenerationModel::Flux1Dev),
    provider_job_id: Some(job_token.to_string()),
  })
}
