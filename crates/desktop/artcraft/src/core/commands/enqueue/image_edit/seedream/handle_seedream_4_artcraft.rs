use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageQuality, EditImageSize, EnqueueEditImageCommand};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4_multi_function_image_gen::{BytedanceSeedreamV4MultiFunctionImageGenImageSize, BytedanceSeedreamV4MultiFunctionImageGenNumImages, BytedanceSeedreamV4MultiFunctionImageGenRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::endpoints::generate::image::multi_function::bytedance_seedream_v4_multi_function_image_gen_image::bytedance_seedream_v4_multi_function_image_gen;
use tauri::AppHandle;

const MAX_IMAGES: usize = 4;

pub async fn handle_seedream_4_edit_artcraft(
  request: &EnqueueEditImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(GenerateError::needs_storyteller_credentials());
    },
  };

  info!("Calling Artcraft seedream 4 (edit) ...");

  let uuid_idempotency_token = generate_random_uuid();
  
  let image_size = request.aspect_ratio
      .map(|size| match size {
        EditImageSize::Auto => BytedanceSeedreamV4MultiFunctionImageGenImageSize::Square,
        EditImageSize::Square => BytedanceSeedreamV4MultiFunctionImageGenImageSize::Square,
        EditImageSize::Tall => BytedanceSeedreamV4MultiFunctionImageGenImageSize::PortraitSixteenNine,
        EditImageSize::Wide => BytedanceSeedreamV4MultiFunctionImageGenImageSize::LandscapeSixteenNine,
      });

  let num_images = match request.image_count {
    None => None,
    Some(1) => Some(BytedanceSeedreamV4MultiFunctionImageGenNumImages::One),
    Some(2) => Some(BytedanceSeedreamV4MultiFunctionImageGenNumImages::Two),
    Some(3) => Some(BytedanceSeedreamV4MultiFunctionImageGenNumImages::Three),
    Some(4) => Some(BytedanceSeedreamV4MultiFunctionImageGenNumImages::Four),
    Some(other) => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages {
        min: 1,
        max: 4,
        requested: other,
      }));
    },
  };
  
  let mut media_tokens = Vec::with_capacity(10);
  
  if let Some(scene_image_media_token) = request.scene_image_media_token.clone() {
    media_tokens.push(scene_image_media_token);
  }
  
  if let Some(image_media_tokens) = request.image_media_tokens.as_ref() {
    media_tokens.extend_from_slice(image_media_tokens);
  }
  
  if media_tokens.len() > MAX_IMAGES {
    return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages { 
      min: 1,
      max: MAX_IMAGES as u32,
      provided: media_tokens.len() as u32,
    }));
  }

  let request = BytedanceSeedreamV4MultiFunctionImageGenRequest {
    uuid_idempotency_token,
    prompt: Some(request.prompt.clone()),
    image_media_tokens: Some(media_tokens),
    image_size,
    num_images,
    // Not provided
    max_images: None,
  };

  let result = bytedance_seedream_v4_multi_function_image_gen(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;
  
  let job_id = match result {
    Ok(enqueued) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued Artcraft seedream 4. Job token: {}", 
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft seedream 4: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };
  
  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::Seedream4),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}
