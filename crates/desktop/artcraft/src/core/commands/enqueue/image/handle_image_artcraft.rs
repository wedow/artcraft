use crate::core::commands::enqueue::image::enqueue_text_to_image_command::{EnqueueTextToImageModel, EnqueueTextToImageRequest};
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::download_media_file_to_temp_dir::download_media_file_to_temp_dir;
use crate::core::utils::save_base64_image_to_temp_dir::save_base64_image_to_temp_dir;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageRequest;
use artcraft_api_defs::generate::object::generate_hunyuan_2_image_to_3d::GenerateHunyuan2ImageTo3dRequest;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProImageToVideoRequest;
use fal_client::creds::fal_api_key::FalApiKey;
use fal_client::requests::queue::enqueue_hunyuan2_image_to_3d::{enqueue_hunyuan2_image_to_3d, Hunyuan2Args};
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use fal_client::requests::queue::image_gen::enqueue_recraft3_text_to_image::{enqueue_recraft3_text_to_image, Recraft3TextToImageArgs};
use idempotency::uuid::generate_random_uuid;
use log::{error, info, warn};
use storyteller_client::generate::image::generate_flux_pro_11_ultra_text_to_image::generate_flux_pro_11_ultra_text_to_image;
use storyteller_client::generate::object::generate_hunyuan2_image_to_3d::generate_hunyuan2_image_to_3d;
use storyteller_client::generate::video::generate_kling_16_pro_image_to_video::generate_kling_16_pro_image_to_video;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, State};

pub async fn handle_image_artcraft(
  request: EnqueueTextToImageRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<(), InternalImageError> {

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
  
  let mut selected_model = None;
  
  let job_token = match request.model {
    None => {
      return Err(InternalImageError::NoModelSpecified);
    }
    Some(EnqueueTextToImageModel::GptImage1) => {
      return Err(InternalImageError::AnyhowError(anyhow!("wrong logic: artcraft is handling sora images")));
    }
    Some(EnqueueTextToImageModel::Recraft3) => {
      return Err(InternalImageError::AnyhowError(anyhow!("not yet implemented in Artcraft")));
    }
    Some(EnqueueTextToImageModel::FluxProUltra) => {
      info!("enqueue Flux Pro Ultra");
      selected_model = Some(GenerationModel::FluxPro11Ultra);
      let request = GenerateFluxPro11UltraTextToImageRequest {
        uuid_idempotency_token,
        prompt: request.prompt,
        aspect_ratio: None,
        num_images: None,
      };
      let result = generate_flux_pro_11_ultra_text_to_image(
        &ApiHost::Storyteller,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft flux pro ultra text to image generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft flux pro ultra text to image generation: {:?}", err);
          return Err(InternalImageError::StorytellerError(err));
        }
      }
    }
  };

  Ok(())
}
