use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use crate::core::api_adapters::aspect_ratio::convert::aspect_ratio_to_artcraft_nano_banana_pro::aspect_ratio_to_artcraft_nano_banana_pro;
use crate::core::api_adapters::resolution::common_resolution::CommonResolution;
use crate::core::api_adapters::resolution::convert::resolution_to_artcraft_nano_banana_pro::resolution_to_artcraft_nano_banana_pro;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason, ProviderFailureReason};
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageQuality, EditImageResolution, EditImageSize};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageResolution, TextToImageSize};
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::image::edit::gemini_25_flash_edit_image::{Gemini25FlashEditImageNumImages, Gemini25FlashEditImageRequest};
use artcraft_api_defs::generate::image::multi_function::nano_banana_pro_multi_function_image_gen::{NanoBananaProMultiFunctionImageGenAspectRatio, NanoBananaProMultiFunctionImageGenImageResolution, NanoBananaProMultiFunctionImageGenNumImages, NanoBananaProMultiFunctionImageGenRequest};
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::{GenerateGptImage1TextToImageImageQuality, GenerateGptImage1TextToImageImageSize, GenerateGptImage1TextToImageNumImages, GenerateGptImage1TextToImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::recipes::simple_image_gen_with_session_auto_renew::{simple_image_gen_with_session_auto_renew, SimpleImageGenAutoRenewRequest};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use storyteller_client::endpoints::generate::image::edit::gemini_25_flash_edit_image::gemini_25_flash_edit_image;
use storyteller_client::endpoints::generate::image::multi_function::nano_banana_pro_multi_function_image_gen_image::nano_banana_pro_multi_function_image_gen;
use tauri::AppHandle;

pub async fn handle_artcraft_nano_banana_pro_text_to_image(
  request: &EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials));
    },
  };

  info!("Calling Artcraft Nano Banana Pro...");

  let uuid_idempotency_token = generate_random_uuid();

  let num_images = match request.number_images {
    None => None,
    Some(1) => Some(NanoBananaProMultiFunctionImageGenNumImages::One),
    Some(2) => Some(NanoBananaProMultiFunctionImageGenNumImages::Two),
    Some(3) => Some(NanoBananaProMultiFunctionImageGenNumImages::Three),
    Some(4) => Some(NanoBananaProMultiFunctionImageGenNumImages::Four),
    Some(other) => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages {
        min: 1,
        max: 4,
        requested: other,
      }));
    },
  };

  let aspect_ratio = get_aspect_ratio(request);
  let resolution = get_resolution(request);

  let request = NanoBananaProMultiFunctionImageGenRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    image_media_tokens: request.image_media_tokens.clone(),
    num_images,
    resolution,
    aspect_ratio,
  };
  
  info!("Calling Artcraft with request {:?}", request);

  let result = nano_banana_pro_multi_function_image_gen(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;

  let job_id = match result {
    Ok(enqueued) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued Artcraft Nano Banana. Job token: {}",
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft Nano Banana: {:?}", err);
      return Err(GenerateError::ProviderFailure(ProviderFailureReason::StorytellerError(err)));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::NanoBananaPro),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}

fn get_aspect_ratio(request: &EnqueueTextToImageRequest) -> Option<NanoBananaProMultiFunctionImageGenAspectRatio> {
  if let Some(common_aspect_ratio) = request.common_aspect_ratio {
    // Handle modern aspect ratio
    let aspect = aspect_ratio_to_artcraft_nano_banana_pro(common_aspect_ratio);
    return Some(aspect);
  }
  
  if let Some(aspect_ratio) = request.aspect_ratio {
    // Handle deprecated aspect ratio
    return match aspect_ratio {
      TextToImageSize::Auto => Some(NanoBananaProMultiFunctionImageGenAspectRatio::Auto),
      TextToImageSize::Square => Some(NanoBananaProMultiFunctionImageGenAspectRatio::OneByOne),
      TextToImageSize::Wide => Some(NanoBananaProMultiFunctionImageGenAspectRatio::SixteenByNine),
      TextToImageSize::Tall => Some(NanoBananaProMultiFunctionImageGenAspectRatio::NineBySixteen),
    }
  }
  
  None
}

fn get_resolution(request: &EnqueueTextToImageRequest) -> Option<NanoBananaProMultiFunctionImageGenImageResolution> {
  if let Some(common_resolution) = request.common_resolution {
    return Some(resolution_to_artcraft_nano_banana_pro(common_resolution));
  }

  if let Some(resolution) = request.image_resolution {
    // Deprecated resolution
    return Some(match resolution {
      TextToImageResolution::OneK => NanoBananaProMultiFunctionImageGenImageResolution::OneK,
      TextToImageResolution::TwoK => NanoBananaProMultiFunctionImageGenImageResolution::TwoK,
      TextToImageResolution::FourK => NanoBananaProMultiFunctionImageGenImageResolution::FourK,
    })
  }
  
  None
}
