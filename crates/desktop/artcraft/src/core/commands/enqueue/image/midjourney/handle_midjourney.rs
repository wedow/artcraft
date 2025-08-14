use crate::core::commands::enqueue::image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::{EditImageQuality, EditImageSize};
use crate::core::commands::enqueue::image_edit::errors::InternalContextualEditImageError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::image::generate_gpt_image_1_text_to_image::{GenerateGptImage1TextToImageImageQuality, GenerateGptImage1TextToImageImageSize, GenerateGptImage1TextToImageNumImages, GenerateGptImage1TextToImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use midjourney_client::client::midjourney_hostname::MidjourneyHostname;
use midjourney_client::endpoints::submit_job::{submit_job, SubmitJobRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::recipes::simple_image_gen_with_session_auto_renew::{simple_image_gen_with_session_auto_renew, SimpleImageGenAutoRenewRequest};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use storyteller_client::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use storyteller_client::generate::image::generate_gpt_image_1_text_to_image::generate_gpt_image_1_text_to_image;
use tauri::AppHandle;

pub async fn handle_midjourney(
  request: EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  mj_creds_manager: &MidjourneyCredentialManager,
) -> Result<TaskEnqueueSuccess, InternalImageError> {

  let creds = match mj_creds_manager.maybe_copy_cookie_store() {
    Ok(Some(creds)) => creds,
    Ok(None) => {
      return Err(InternalImageError::NeedsMidjourneyCredentials);
    }
    Err(err) => {
      error!("Error reading Midjourney credentials: {:?}", err);
      return Err(InternalImageError::NeedsMidjourneyCredentials);
    },
  };

  info!("Calling midjourney ...");

  let cookie_header = creds.to_cookie_string();

  let prompt = request.prompt
      .as_deref()
      .unwrap_or("");


  let result = submit_job(SubmitJobRequest {
    prompt,
    channel_id: "singleplayer_f8a57ac3-e416-4dd4-9be8-2c4223691b01", // TODO: DO NOT COMMIT
    hostname: MidjourneyHostname::Standard,
    cookie_header,
  }).await;

  let job_id = match result {
    Ok(result) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued MidJourney. Job token: {}",result.job_id);
      result.job_id
    }
    Err(err) => {
      error!("Failed to use MidJourney: {:?}", err);
      return Err(InternalImageError::MidjourneyError(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Midjourney,
    model: Some(GenerationModel::Midjourney),
    provider_job_id: Some(job_id),
    task_type: TaskType::ImageGeneration,
  })
}
