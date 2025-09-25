use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::task_database::TaskDatabase;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::threads::storyteller_activity_thread::storyteller_activity_thread;
use crate::services::storyteller::threads::storyteller_task_polling_thread::storyteller_task_polling_thread;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager};

pub fn spawn_storyteller_threads(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {
  
  tauri::async_runtime::spawn(storyteller_task_polling_thread(
    app.clone(),
    app_env_configs.clone(),
    task_database.clone(),
    storyteller_creds_manager.clone(),
  ));

  tauri::async_runtime::spawn(storyteller_activity_thread(
    app_env_configs.clone(),
    storyteller_creds_manager.clone(),
  ));
  
  Ok(())
}
