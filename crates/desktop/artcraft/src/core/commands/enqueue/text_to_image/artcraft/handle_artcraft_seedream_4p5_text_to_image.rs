use crate::core::api_adapters::aspect_ratio::convert::aspect_ratio_to_artcraft_seedream_4p5::aspect_ratio_to_artcraft_seedream_4p5;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageQuality, EnqueueEditImageCommand};
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
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4p5_multi_function_image_gen::{BytedanceSeedreamV4p5MultiFunctionImageGenImageSize, BytedanceSeedreamV4p5MultiFunctionImageGenNumImages, BytedanceSeedreamV4p5MultiFunctionImageGenRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use std::time::Duration;
use storyteller_client::endpoints::generate::image::multi_function::bytedance_seedream_v4p5_multi_function_image_gen_image::bytedance_seedream_v4p5_multi_function_image_gen;
use tauri::AppHandle;

pub async fn handle_artcraft_seedream_4p5_text_to_image(
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

  info!("Calling Artcraft seedream 4.5 ...");

  let uuid_idempotency_token = generate_random_uuid();

  let image_size = get_aspect_ratio(request);

  let num_images = match request.number_images {
    None => None,
    Some(1) => Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::One),
    Some(2) => Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::Two),
    Some(3) => Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::Three),
    Some(4) => Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::Four),
    // TODO: Error
    //Some(other) => {
    //  return Err(InternalImageError::InvalidNumberOfRequestedImages {
    //    min: 1,
    //    max: 4,
    //    requested: other,
    //  });
    //},
    _ => Some(BytedanceSeedreamV4p5MultiFunctionImageGenNumImages::One), // Default to one image if invalid number
  };

  let request = BytedanceSeedreamV4p5MultiFunctionImageGenRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    num_images,
    image_size,
    // Not provided for text-to-image
    image_media_tokens: None,
    // Not provided
    max_images: None,
  };

  let result = bytedance_seedream_v4p5_multi_function_image_gen(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;

  let job_id = match result {
    Ok(enqueued) => {
      info!("Successfully enqueued Artcraft seedream 4.5. Job token: {}", 
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft seedream 4.5: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::Seedream4p5),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}

fn get_aspect_ratio(request: &EnqueueTextToImageRequest) -> Option<BytedanceSeedreamV4p5MultiFunctionImageGenImageSize> {
  if let Some(common_aspect_ratio) = request.common_aspect_ratio {
    // Handle modern aspect ratio
    let aspect = aspect_ratio_to_artcraft_seedream_4p5(common_aspect_ratio);
    return Some(aspect);
  }

  if let Some(aspect_ratio) = request.aspect_ratio {
    // Handle deprecated aspect ratio
    let aspect_ratio = match aspect_ratio {
      TextToImageSize::Auto => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Square,
      TextToImageSize::Square => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Square,
      TextToImageSize::Tall => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitSixteenNine,
      TextToImageSize::Wide => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeSixteenNine,
    };
    return Some(aspect_ratio);
  }

  None
}
