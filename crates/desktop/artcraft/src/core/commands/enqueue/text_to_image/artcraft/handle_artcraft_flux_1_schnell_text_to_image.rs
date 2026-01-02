use crate::core::api_adapters::aspect_ratio::convert::aspect_ratio_to_artcraft_flux_1_dev::aspect_ratio_to_artcraft_flux_1_dev;
use crate::core::api_adapters::aspect_ratio::convert::aspect_ratio_to_artcraft_flux_1_schnell::aspect_ratio_to_artcraft_flux_1_schnell;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::{GenerateFlux1SchnellTextToImageAspectRatio, GenerateFlux1SchnellTextToImageNumImages, GenerateFlux1SchnellTextToImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::endpoints::generate::image::text::generate_flux_1_schnell_text_to_image::generate_flux_1_schnell_text_to_image;

pub async fn handle_artcraft_flux_1_schnell_text_to_image(
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

  info!("enqueue Flux 1 Schnell");
  
  let uuid_idempotency_token = generate_random_uuid();
  
  let request = GenerateFlux1SchnellTextToImageRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    aspect_ratio: get_aspect_ratio(request),
    num_images: request.number_images
        .and_then(|num| match num {
          1 => Some(GenerateFlux1SchnellTextToImageNumImages::One),
          2 => Some(GenerateFlux1SchnellTextToImageNumImages::Two),
          3 => Some(GenerateFlux1SchnellTextToImageNumImages::Three),
          4 => Some(GenerateFlux1SchnellTextToImageNumImages::Four),
          _ => None, // NB: use service defaults
        }),
  };
  
  let result = generate_flux_1_schnell_text_to_image(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;
  
  let job_token = match result {
    Ok(enqueued) => {
      info!("Successfully enqueued Artcraft Flux 1 Schnell text to image generation");
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft Flux 1 Schnell text to image generation: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    task_type: TaskType::ImageGeneration,
    model: Some(GenerationModel::Flux1Schnell),
    provider_job_id: Some(job_token.to_string()),
  })
}

fn get_aspect_ratio(request: &EnqueueTextToImageRequest) -> Option<GenerateFlux1SchnellTextToImageAspectRatio> {
  if let Some(common_aspect_ratio) = request.common_aspect_ratio {
    // Handle modern aspect ratio
    let aspect = aspect_ratio_to_artcraft_flux_1_schnell(common_aspect_ratio);
    return Some(aspect);
  }

  if let Some(aspect_ratio) = request.aspect_ratio {
    // Handle deprecated aspect ratio
    let aspect = match aspect_ratio {
      TextToImageSize::Tall => GenerateFlux1SchnellTextToImageAspectRatio::PortraitNineBySixteen,
      TextToImageSize::Wide => GenerateFlux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine,
      TextToImageSize::Auto => GenerateFlux1SchnellTextToImageAspectRatio::SquareHd,
      TextToImageSize::Square => GenerateFlux1SchnellTextToImageAspectRatio::SquareHd,
    };
    return Some(aspect);
  }

  None
}
