use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::commands::enqueue::text_to_image::gpt_image::handle_gpt_image_1p5_artcraft::handle_gpt_image_1p5_artcraft;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use tauri::AppHandle;

pub async fn handle_gpt_image_1p5(
  request: &EnqueueTextToImageRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  handle_gpt_image_1p5_artcraft(
    request,
    app_env_configs,
    storyteller_creds_manager
  ).await
}
