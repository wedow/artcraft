use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_edit::gpt_image_1::handle_gpt_image_1_edit_artcraft::handle_gpt_image_1_edit_artcraft;
use crate::core::commands::enqueue::image_edit::gpt_image_1::handle_gpt_image_1_edit_sora::handle_gpt_image_1_edit_sora;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::commands::enqueue::text_to_image::gemini_25_flash::handle_gemini_25_flash_artcraft::handle_gemini_25_flash_artcraft;
use crate::core::commands::enqueue::text_to_image::gpt_image_1::handle_gpt_image_1_artcraft::handle_gpt_image_1_artcraft;
use crate::core::commands::enqueue::text_to_image::gpt_image_1::handle_gpt_image_1_sora::handle_gpt_image_1_sora;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::recipes::simple_image_gen_with_session_auto_renew::{simple_image_gen_with_session_auto_renew, SimpleImageGenAutoRenewRequest};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use tauri::AppHandle;

pub async fn handle_gemini_25_flash(
  request: &EnqueueTextToImageRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  provider_priority_store: &ProviderPriorityStore,
  storyteller_creds_manager: &StorytellerCredentialManager,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let priority = provider_priority_store.get_priority()?;

  // TODO: Check if providers are available before proceeding.

  info!("Providers by priority: {:?}", priority);

  for provider in priority.iter() {
    match provider {
      Provider::Fal => {
        // Fallthrough (for now)
      }
      Provider::Sora => {
        // Fallthrough
      }
      Provider::Artcraft => {
        info!("Dispatching gemini 2.5 flash via Artcraft...");
        return handle_gemini_25_flash_artcraft(
          request,
          app_env_configs,
          storyteller_creds_manager
        ).await;
      }
    }
  }

  Err(GenerateError::NoProviderAvailable)
}
