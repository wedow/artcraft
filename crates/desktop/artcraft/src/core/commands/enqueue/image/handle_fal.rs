use crate::core::commands::enqueue::image::enqueue_text_to_image_command::{EnqueueTextToImageModel, EnqueueTextToImageRequest};
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use fal_client::creds::fal_api_key::FalApiKey;
use fal_client::requests::image_gen::enqueue_flux_pro_ultra_text_to_image::{enqueue_flux_pro_ultra_text_to_image, FluxProUltraTextToImageArgs};
use fal_client::requests::image_gen::enqueue_recraft3_text_to_image::{enqueue_recraft3_text_to_image, Recraft3TextToImageArgs};
use log::{error, info, warn};
use tauri::AppHandle;

pub async fn handle_fal(
  app: &AppHandle,
  request: EnqueueTextToImageRequest,
  fal_creds_manager: &FalCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<(), InternalImageError> {

  let api_key = match fal_creds_manager.get_key()? {
    Some(key) => key,
    None => {
      error!("No FAL API key is set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_fal_api_key(GenerationAction::GenerateImage);

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      return Err(InternalImageError::NeedsFalApiKey);
    },
  };
  
  let api_key = fal_creds_manager.get_key_required()
      .map_err(|err| {
        error!("EnqueueTextToImage FAL api key required: {:?}", err);
        InternalImageError::NeedsFalApiKey
      })?;

  let prompt = request.prompt.as_deref().unwrap_or("");

  let result = match request.model {
    None => {
      return Err(InternalImageError::NoModelSpecified);
    }
    Some(EnqueueTextToImageModel::GptImage1) => {
      return Err(InternalImageError::AnyhowError(anyhow!("wrong logic: fal is handling sora images")));
    }
    Some(EnqueueTextToImageModel::FluxProUltra) => {
      info!("enqueue Flux Pro Ultra text-to-image with prompt: {}", prompt);
      enqueue_flux_pro_ultra_text_to_image(FluxProUltraTextToImageArgs {
        prompt,
        api_key: &api_key,
      }).await
    }
    Some(EnqueueTextToImageModel::Recraft3) => {
      info!("enqueue Recraft v3 text-to-image with prompt: {}", prompt);
      enqueue_recraft3_text_to_image(Recraft3TextToImageArgs {
        prompt,
        api_key: &api_key,
      }).await
    }
  };

  match result {
    Ok(enqueued) => {
      info!("Successfully enqueued text to image");

      let event = GenerationEnqueueSuccessEvent {
        action: GenerationAction::GenerateImage,
        service: GenerationServiceProvider::Fal,
        model: None,
      };

      if let Err(err) = event.send(app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      if let Err(err) = fal_task_queue.insert(&enqueued) {
        error!("Failed to enqueue task: {:?}", err);
        return Err(InternalImageError::AnyhowError(anyhow!("Failed to enqueue task: {:?}", err)));
      }
    }
    Err(err) => {
      error!("Failed to enqueue text to image: {:?}", err);

      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::GenerateImage,
        service: GenerationServiceProvider::Fal,
        model: None,
        reason: None,
      };

      if let Err(err) = event.send(app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      return Err(InternalImageError::FalError(err));
    }
  }

  Ok(())
}
