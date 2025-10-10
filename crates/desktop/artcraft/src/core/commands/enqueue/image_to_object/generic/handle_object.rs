use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_to_object::enqueue_image_to_3d_object_command::EnqueueImageTo3dObjectRequest;
use crate::core::commands::enqueue::image_to_object::generic::handle_object_artcraft::handle_object_artcraft;
use crate::core::commands::enqueue::image_to_object::generic::handle_object_fal::handle_object_fal;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use tauri::AppHandle;

pub async fn handle_object(
  request: EnqueueImageTo3dObjectRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  provider_priority_store: &ProviderPriorityStore,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let priority = provider_priority_store.get_priority()?;

  for provider in priority.iter() {
    match provider {
      Provider::Fal => {} // Fallthrough
      Provider::Sora => {} // Fallthrough
      Provider::Artcraft => {
        return Ok(handle_object_artcraft(
          request,
          app,
          app_env_configs,
          app_data_root,
          storyteller_creds_manager
        ).await?);
      }
    }
  }

  Err(GenerateError::NoProviderAvailable)
}
