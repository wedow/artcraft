use crate::core::lifecycle::startup::bootstrap_task_database::bootstrap_task_database;
use crate::core::lifecycle::startup::size_and_position_windows::size_and_position_windows;
use crate::core::lifecycle::startup::spawn_fal_task_polling_thread::spawn_fal_task_polling_thread;
use crate::core::lifecycle::startup::spawn_main_window_thread::spawn_main_window_thread;
use crate::core::lifecycle::startup::spawn_sora_task_polling_thread::spawn_sora_task_polling_thread;
use crate::core::lifecycle::startup::spawn_storytoller_task_polling_thread::spawn_storyteller_task_polling_thread;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager};
use crate::core::lifecycle::startup::spawn_discord_presence_thread::spawn_discord_presence_thread;

pub async fn handle_tauri_startup(
  app: AppHandle,
  root: AppDataRoot,
  app_env_configs: AppEnvConfigs,
  storyteller_creds_manager: StorytellerCredentialManager,
  sora_credential_manager: SoraCredentialManager,
  sora_task_queue: SoraTaskQueue,
  fal_credential_manager: FalCredentialManager,
  fal_task_queue: FalTaskQueue,
) -> AnyhowResult<()> {
  
  let task_database = 
      bootstrap_task_database(&app, &root).await?;

  spawn_main_window_thread(
    &app,
    &root,
    &storyteller_creds_manager,
  )?;

  spawn_storyteller_task_polling_thread(
    &app,
    &app_env_configs,
    &task_database,
    &storyteller_creds_manager,
  )?;
  
  spawn_sora_task_polling_thread(
    &app,
    &root,
    &app_env_configs,
    &sora_credential_manager,
    &storyteller_creds_manager,
    &sora_task_queue,
  )?;
  
  spawn_fal_task_polling_thread(
    &app,
    &root,
    &app_env_configs,
    &fal_credential_manager,
    &fal_task_queue,
    &storyteller_creds_manager,
  )?;
  
  spawn_discord_presence_thread()?;
  
  size_and_position_windows(&app, &root);

  Ok(())
}
