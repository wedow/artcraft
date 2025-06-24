use crate::core::commands::enqueue::image::enqueue_text_to_image_command::{EnqueueTextToImageModel, EnqueueTextToImageRequest};
use crate::core::commands::enqueue::object::enqueue_image_to_3d_object_command::{EnqueueImageTo3dObjectModel, EnqueueImageTo3dObjectRequest};
use crate::core::commands::enqueue::object::internal_object_error::InternalObjectError;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
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
use artcraft_api_defs::generate::object::generate_hunyuan_2_0_image_to_3d::GenerateHunyuan20ImageTo3dRequest;
use fal_client::creds::fal_api_key::FalApiKey;
use fal_client::requests::queue::enqueue_hunyuan2_image_to_3d::{enqueue_hunyuan2_image_to_3d, Hunyuan2Args};
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use fal_client::requests::queue::image_gen::enqueue_recraft3_text_to_image::{enqueue_recraft3_text_to_image, Recraft3TextToImageArgs};
use idempotency::uuid::generate_random_uuid;
use log::{error, info, warn};
use storyteller_client::generate::object::generate_hunyuan_3d_2_0_image_to_3d::generate_hunyuan3d_2_0_image_to_3d;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, State};
use artcraft_api_defs::generate::object::generate_hunyuan_2_1_image_to_3d::GenerateHunyuan21ImageTo3dRequest;
use storyteller_client::generate::object::generate_hunyuan_3d_2_1_image_to_3d::generate_hunyuan3d_2_1_image_to_3d;

pub async fn handle_object_artcraft(
  request: EnqueueImageTo3dObjectRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<(), InternalObjectError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      error!("No Artcraft credentials are set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_artcraft_credentials(GenerationAction::ImageTo3d);

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      return Err(InternalObjectError::NeedsStorytellerCredentials);
    },
  };
  
  //let api_key = fal_creds_manager.get_key_required()
  //    .map_err(|err| {
  //      error!("EnqueueTextToImage FAL api key required: {:?}", err);
  //      InternalObjectError::NeedsFalApiKey
  //    })?;


  info!("Calling Artcraft image to 3d ...");


  let uuid_idempotency_token = generate_random_uuid();
  
  let job_token = match request.model {
    None => {
      return Err(InternalObjectError::NoModelSpecified);
    }
    Some(
      EnqueueImageTo3dObjectModel::Hunyuan3d2 |
      EnqueueImageTo3dObjectModel::Hunyuan3d2_0
    ) => {
      info!("enqueue Artcraft Hunyuan 3D 2.0");
      let request = GenerateHunyuan20ImageTo3dRequest { 
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
      };
      let result = generate_hunyuan3d_2_0_image_to_3d(
        &ApiHost::Storyteller,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Hunyuan 3D 2.0");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Hunyuan 3D 2.0: {:?}", err);
          return Err(InternalObjectError::StorytellerError(err));
        }
      }
    }
    Some(EnqueueImageTo3dObjectModel::Hunyuan3d2_1) => {
      info!("enqueue Artcraft Hunyuan 3D 2.1");
      let request = GenerateHunyuan21ImageTo3dRequest {
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
      };
      let result = generate_hunyuan3d_2_1_image_to_3d(
        &ApiHost::Storyteller,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Hunyuan 3D 2.1");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Hunyuan 3D 2.1: {:?}", err);
          return Err(InternalObjectError::StorytellerError(err));
        }
      }
    }
  };

  info!("Successfully enqueued 3D generation");
  
  let event = GenerationEnqueueSuccessEvent {
    action: GenerationAction::ImageTo3d,
    service: GenerationServiceProvider::Artcraft,
    model: None,
  };
  
  if let Err(err) = event.send(app) {
    error!("Failed to emit event: {:?}", err); // Fail open.
  }
  
  //if let Err(err) = fal_task_queue.insert(&enqueued) {
  //  error!("Failed to enqueue task: {:?}", err);
  //  return Err(InternalObjectError::AnyhowError(anyhow!("Failed to enqueue task: {:?}", err)));
  //}

//  match result {
//    Ok(enqueued) => {
//    }
//    Err(err) => {
//      error!("Failed to enqueue image to 3d: {:?}", err);
//
//      let event = GenerationEnqueueFailureEvent {
//        action: GenerationAction::ImageTo3d,
//        service: GenerationServiceProvider::Fal,
//        model: None,
//        reason: None,
//      };
//
//      if let Err(err) = event.send(app) {
//        error!("Failed to emit event: {:?}", err); // Fail open.
//      }
//
//      return Err(InternalObjectError::FalError(err));
//    }
//  }

  Ok(())
}
