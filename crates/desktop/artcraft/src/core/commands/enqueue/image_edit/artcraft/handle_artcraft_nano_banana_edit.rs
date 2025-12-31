use crate::core::api_adapters::aspect_ratio::convert::aspect_ratio_to_artcraft_nano_banana::aspect_ratio_to_artcraft_nano_banana;
use crate::core::api_adapters::aspect_ratio::convert::aspect_ratio_to_artcraft_nano_banana_pro::aspect_ratio_to_artcraft_nano_banana_pro;
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
use artcraft_api_defs::generate::image::edit::flux_pro_kontext_max_edit_image::{FluxProKontextMaxEditImageNumImages, FluxProKontextMaxEditImageRequest};
use artcraft_api_defs::generate::image::edit::gemini_25_flash_edit_image::{Gemini25FlashEditImageNumImages, Gemini25FlashEditImageRequest};
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{GptImage1EditImageImageQuality, GptImage1EditImageImageSize, GptImage1EditImageNumImages, GptImage1EditImageRequest};
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageRequest;
use artcraft_api_defs::generate::image::multi_function::nano_banana_multi_function_image_gen::{NanoBananaMultiFunctionImageGenAspectRatio, NanoBananaMultiFunctionImageGenNumImages, NanoBananaMultiFunctionImageGenRequest};
use artcraft_api_defs::generate::image::multi_function::nano_banana_pro_multi_function_image_gen::{NanoBananaProMultiFunctionImageGenAspectRatio, NanoBananaProMultiFunctionImageGenRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::endpoints::generate::image::edit::flux_pro_kontext_max_edit_image::flux_pro_kontext_max_edit_image;
use storyteller_client::endpoints::generate::image::edit::gemini_25_flash_edit_image::gemini_25_flash_edit_image;
use storyteller_client::endpoints::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use storyteller_client::endpoints::generate::image::multi_function::nano_banana_multi_function_image_gen_image::nano_banana_multi_function_image_gen;
use storyteller_client::endpoints::generate::image::multi_function::nano_banana_pro_multi_function_image_gen_image::nano_banana_pro_multi_function_image_gen;
use tauri::AppHandle;

pub(super) const MAX_IMAGES: usize = 10;

pub async fn handle_artcraft_nano_banana_edit(
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

  info!("Calling Artcraft Nano Banana (edit) ...");

  let uuid_idempotency_token = generate_random_uuid();

  let aspect_ratio = get_aspect_ratio(request);

  let num_images = match request.image_count {
    None => None,
    Some(1) => Some(NanoBananaMultiFunctionImageGenNumImages::One),
    Some(2) => Some(NanoBananaMultiFunctionImageGenNumImages::Two),
    Some(3) => Some(NanoBananaMultiFunctionImageGenNumImages::Three),
    Some(4) => Some(NanoBananaMultiFunctionImageGenNumImages::Four),
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

  let request = NanoBananaMultiFunctionImageGenRequest {
    uuid_idempotency_token,
    prompt: Some(request.prompt.clone()),
    image_media_tokens: Some(media_tokens),
    num_images,
    aspect_ratio,
  };

  let result = nano_banana_multi_function_image_gen(
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
      return Err(GenerateError::from(err));
    }
  };
  
  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::Gemini25Flash),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}

fn get_aspect_ratio(request: &EnqueueEditImageCommand) -> Option<NanoBananaMultiFunctionImageGenAspectRatio> {
  if let Some(common_aspect_ratio) = request.common_aspect_ratio {
    // Handle modern aspect ratio
    let aspect = aspect_ratio_to_artcraft_nano_banana(common_aspect_ratio);
    return Some(aspect);
  }

  if let Some(aspect_ratio) = request.aspect_ratio {
    // Handle deprecated aspect ratio
    return match aspect_ratio {
      EditImageSize::Auto => Some(NanoBananaMultiFunctionImageGenAspectRatio::Auto),
      EditImageSize::Square => Some(NanoBananaMultiFunctionImageGenAspectRatio::OneByOne),
      EditImageSize::Wide => Some(NanoBananaMultiFunctionImageGenAspectRatio::SixteenByNine),
      EditImageSize::Tall => Some(NanoBananaMultiFunctionImageGenAspectRatio::NineBySixteen),
    }
  }

  None
}
