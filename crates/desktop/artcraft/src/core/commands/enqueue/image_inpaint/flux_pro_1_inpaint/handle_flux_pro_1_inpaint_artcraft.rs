use crate::core::commands::enqueue::image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::{EditImageQuality, EditImageSize, EnqueueContextualEditImageCommand};
use crate::core::commands::enqueue::image_inpaint::enqueue_image_inpaint_command::EnqueueInpaintImageCommand;
use crate::core::commands::enqueue::image_inpaint::errors::InternalImageInpaintError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::model::contextual_image_edit_models::ContextualImageEditModel;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{GptImage1EditImageImageQuality, GptImage1EditImageImageSize, GptImage1EditImageNumImages, GptImage1EditImageRequest};
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageRequest;
use artcraft_api_defs::generate::image::inpaint::flux_pro_1_inpaint_image::{FluxPro1InpaintImageNumImages, FluxPro1InpaintImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use fal_client::requests::webhook::image::enqueue_gpt_image_1_edit_image_webhook::GptEditImageQuality;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use storyteller_client::generate::image::generate_flux_1_dev_text_to_image::generate_flux_1_dev_text_to_image;
use storyteller_client::generate::image::generate_flux_1_schnell_text_to_image::generate_flux_1_schnell_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_text_to_image::generate_flux_pro_11_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_ultra_text_to_image::generate_flux_pro_11_ultra_text_to_image;
use storyteller_client::generate::image::inpaint::flux_pro_1_inpaint_image::flux_pro_1_inpaint_image;
use tauri::AppHandle;

pub async fn handle_flux_pro_1_inpaint_artcraft(
  request: &EnqueueInpaintImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, InternalImageInpaintError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(InternalImageInpaintError::NeedsStorytellerCredentials);
    },
  };

  info!("Calling Artcraft flux pro 1 inpaint ...");

  let uuid_idempotency_token = generate_random_uuid();
  
  let num_images = match request.image_count {
    None => None,
    Some(1) => Some(FluxPro1InpaintImageNumImages::One),
    Some(2) => Some(FluxPro1InpaintImageNumImages::Two),
    Some(3) => Some(FluxPro1InpaintImageNumImages::Three),
    Some(4) => Some(FluxPro1InpaintImageNumImages::Four),
    Some(other) => {
      return Err(InternalImageInpaintError::InvalidNumberOfRequestedImages {
        min: 1,
        max: 4,
        requested: other,
      });
    },
  };
  
  let image_media_token = match &request.image_media_token {
    Some(token) => token.clone(),
    None => {
      return Err(InternalImageInpaintError::NoSourceImageSpecified);
    },
  };

  let mask_media_token = match &request.mask_media_token {
    Some(token) => token.clone(),
    None => {
      return Err(InternalImageInpaintError::NoMaskImageSpecified);
    },
  };

  let request = FluxPro1InpaintImageRequest {
    uuid_idempotency_token,
    prompt: Some(request.prompt.clone()),
    image_media_token,
    mask_media_token,
    num_images,
  };

  let result = flux_pro_1_inpaint_image(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;
  
  let job_id = match result {
    Ok(enqueued) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued Artcraft flux pro 1 inpaint. Job token: {}",
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft flux pro 1 inpaint: {:?}", err);
      return Err(InternalImageInpaintError::StorytellerError(err));
    }
  };
  
  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::FluxProKontextMax),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}
