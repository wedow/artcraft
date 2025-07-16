use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::fal::threads::fal_task_polling_thread::fal_task_polling_thread;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager};

pub fn spawn_fal_task_polling_thread(
  app: &AppHandle,
  root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  fal_credential_manager: &FalCredentialManager,
  fal_task_queue: &FalTaskQueue,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {

  tauri::async_runtime::spawn(fal_task_polling_thread(
    app.clone(),
    app_env_configs.clone(),
    root.clone(),
    fal_credential_manager.clone(),
    fal_task_queue.clone(),
    storyteller_creds_manager.clone(),
  ));

  Ok(())
}
