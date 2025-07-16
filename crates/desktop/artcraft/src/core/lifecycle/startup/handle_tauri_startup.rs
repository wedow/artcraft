use crate::core::lifecycle::startup::bootstrap_task_database::bootstrap_task_database;
use crate::core::lifecycle::startup::spawn_storytoller_task_polling_thread::spawn_storyteller_task_polling_thread;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager};

pub async fn handle_tauri_startup(
  app: AppHandle,
  root: AppDataRoot,
  app_env_configs: AppEnvConfigs,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> AnyhowResult<()> {
  let task_database = bootstrap_task_database(&app, &root).await?;

  spawn_storyteller_task_polling_thread(
    &app,
    &app_env_configs,
    &task_database,
    &storyteller_creds_manager,
  )?;

  Ok(())
}
