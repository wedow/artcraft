use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::commands::enqueue::text_to_image::internal_image_error::InternalImageError;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::{GenerateFlux1DevTextToImageAspectRatio, GenerateFlux1DevTextToImageNumImages, GenerateFlux1DevTextToImageRequest};
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::{GenerateFlux1SchnellTextToImageAspectRatio, GenerateFlux1SchnellTextToImageNumImages, GenerateFlux1SchnellTextToImageRequest};
use artcraft_api_defs::generate::image::generate_flux_pro_11_text_to_image::{GenerateFluxPro11TextToImageAspectRatio, GenerateFluxPro11TextToImageNumImages, GenerateFluxPro11TextToImageRequest};
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::{GenerateFluxPro11UltraTextToImageAspectRatio, GenerateFluxPro11UltraTextToImageNumImages, GenerateFluxPro11UltraTextToImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::generate::image::generate_flux_1_dev_text_to_image::generate_flux_1_dev_text_to_image;
use storyteller_client::generate::image::generate_flux_1_schnell_text_to_image::generate_flux_1_schnell_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_text_to_image::generate_flux_pro_11_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_ultra_text_to_image::generate_flux_pro_11_ultra_text_to_image;
use tauri::AppHandle;

pub async fn handle_image_artcraft(
  request: &EnqueueTextToImageRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, InternalImageError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      error!("No Artcraft credentials are set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_artcraft_credentials(GenerationAction::GenerateImage);

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      return Err(InternalImageError::NeedsStorytellerCredentials);
    },
  };
  
  info!("Calling Artcraft text to image...");

  let uuid_idempotency_token = generate_random_uuid();
  
  let mut selected_model;
  
  let job_token = match request.model {
    None => {
      return Err(InternalImageError::NoModelSpecified);
    }
    Some(
      ImageModel::GptImage1 |
      ImageModel::Midjourney
    ) => {
      return Err(InternalImageError::AnyhowError(anyhow!("wrong logic: another branch should handle this: {:?}", request.model)));
    }
    Some(ImageModel::Recraft3) => {
      return Err(InternalImageError::AnyhowError(anyhow!("not yet implemented in Artcraft")));
    }
    Some(ImageModel::Flux1Dev) => {
      info!("enqueue Flux 1 Dev");
      selected_model = GenerationModel::Flux1Dev;
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
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Flux 1 Dev text to image generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Flux 1 Dev text to image generation: {:?}", err);
          return Err(InternalImageError::StorytellerError(err));
        }
      }
    }
    Some(ImageModel::Flux1Schnell) => {
      info!("enqueue Flux 1 Schnell");
      selected_model = GenerationModel::Flux1Schnell;
      let request = GenerateFlux1SchnellTextToImageRequest {
        uuid_idempotency_token,
        prompt: request.prompt.clone(),
        aspect_ratio: request.aspect_ratio
            .map(|aspect| match aspect {
              // TODO(bt,2025-07-14): Support other aspect ratios.
              TextToImageSize::Tall => GenerateFlux1SchnellTextToImageAspectRatio::PortraitNineBySixteen,
              TextToImageSize::Wide => GenerateFlux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine,
              TextToImageSize::Square => GenerateFlux1SchnellTextToImageAspectRatio::SquareHd,
              TextToImageSize::Auto => GenerateFlux1SchnellTextToImageAspectRatio::SquareHd,
            }),
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
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Flux 1 Schnell text to image generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Flux 1 Schnell text to image generation: {:?}", err);
          return Err(InternalImageError::StorytellerError(err));
        }
      }
    }
    Some(ImageModel::FluxPro11) => {
      info!("enqueue Flux Pro 1.1");
      selected_model = GenerationModel::FluxPro11;
      let request = GenerateFluxPro11TextToImageRequest {
        uuid_idempotency_token,
        prompt: request.prompt.clone(),
        aspect_ratio: request.aspect_ratio
            .map(|aspect| match aspect {
              // TODO(bt,2025-07-14): Support other aspect ratios.
              TextToImageSize::Tall => GenerateFluxPro11TextToImageAspectRatio::PortraitNineBySixteen,
              TextToImageSize::Wide => GenerateFluxPro11TextToImageAspectRatio::LandscapeSixteenByNine,
              TextToImageSize::Square => GenerateFluxPro11TextToImageAspectRatio::Square,
              TextToImageSize::Auto => GenerateFluxPro11TextToImageAspectRatio::Square,
            }),
        num_images: request.number_images
            .and_then(|num| match num {
              1 => Some(GenerateFluxPro11TextToImageNumImages::One),
              2 => Some(GenerateFluxPro11TextToImageNumImages::Two),
              3 => Some(GenerateFluxPro11TextToImageNumImages::Three),
              4 => Some(GenerateFluxPro11TextToImageNumImages::Four),
              _ => None, // NB: use service defaults
            }),
      };
      let result = generate_flux_pro_11_text_to_image(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Flux Pro 1.1 text to image generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Flux Pro 1.1 text to image generation: {:?}", err);
          return Err(InternalImageError::StorytellerError(err));
        }
      }
    }
    Some(ImageModel::FluxPro11Ultra) => {
      info!("enqueue Flux Pro 1.1 Ultra");
      selected_model = GenerationModel::FluxPro11Ultra;
      let request = GenerateFluxPro11UltraTextToImageRequest {
        uuid_idempotency_token,
        prompt: request.prompt.clone(),
        aspect_ratio: request.aspect_ratio
            .map(|aspect| match aspect {
              // TODO(bt,2025-07-14): Support other aspect ratios.
              TextToImageSize::Tall => GenerateFluxPro11UltraTextToImageAspectRatio::PortraitNineBySixteen,
              TextToImageSize::Wide => GenerateFluxPro11UltraTextToImageAspectRatio::LandscapeSixteenByNine,
              TextToImageSize::Square => GenerateFluxPro11UltraTextToImageAspectRatio::Square,
              TextToImageSize::Auto => GenerateFluxPro11UltraTextToImageAspectRatio::Square,
            }),
        num_images: request.number_images
            .and_then(|num| match num {
              1 => Some(GenerateFluxPro11UltraTextToImageNumImages::One),
              2 => Some(GenerateFluxPro11UltraTextToImageNumImages::Two),
              3 => Some(GenerateFluxPro11UltraTextToImageNumImages::Three),
              4 => Some(GenerateFluxPro11UltraTextToImageNumImages::Four),
              _ => None, // NB: use service defaults
            }),
      };
      let result = generate_flux_pro_11_ultra_text_to_image(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Flux Pro 1.1 Ultra text to image generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Flux Pro 1.1 Ultra text to image generation: {:?}", err);
          return Err(InternalImageError::StorytellerError(err));
        }
      }
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    task_type: TaskType::ImageGeneration,
    model: Some(selected_model),
    provider_job_id: Some(job_token.to_string()),
  })
}
