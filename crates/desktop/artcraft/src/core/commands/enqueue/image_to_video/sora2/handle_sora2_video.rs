use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::EnqueueContextualEditImageCommand;
use crate::core::commands::enqueue::image_inpaint::enqueue_image_inpaint_command::EnqueueInpaintImageCommand;
use crate::core::commands::enqueue::image_to_video::enqueue_image_to_video_command::EnqueueImageToVideoRequest;
use crate::core::commands::enqueue::image_to_video::sora2::handle_sora2_video_sora::handle_sora2_video_sora;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use log::info;
use tauri::AppHandle;

pub async fn handle_sora2_video(
  request: &EnqueueImageToVideoRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  provider_priority_store: &ProviderPriorityStore,
  sora_creds_manager: &SoraCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let priority = provider_priority_store.get_priority()?;

  // TODO: Check if providers are available before proceeding.

  info!("Providers by priority: {:?}", priority);

  for provider in priority.iter() {
    match provider {
      Provider::Fal => {
        // Fallthrough (for now)
      }
      Provider::Artcraft => {
        // Fallthrough
      }
      Provider::Sora => {
        info!("Dispatching Sora2 via OpenAI Sora...");
        return handle_sora2_video_sora(
          request,
          app,
          app_data_root,
          app_env_configs,
          sora_creds_manager,
        ).await;
      }
    }
  }

  Err(GenerateError::NoProviderAvailable)
}
