use crate::core::state::app_startup_time::AppStartupTime;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::main_window_position::MainWindowPosition;
use crate::core::state::main_window_size::MainWindowSize;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::core::threads::main_window_thread::persist_storyteller_cookies_task::persist_storyteller_cookies_task;
use crate::core::threads::main_window_thread::persist_window_position_task::persist_window_position_task;
use crate::core::threads::main_window_thread::persist_window_resize_task::persist_window_resize_task;
use errors::AnyhowResult;
use log::{error, info};
use memory_store::clone_slot::CloneSlot;
use tauri::{AppHandle, Manager, Webview, Window};

const MAIN_WINDOW_NAME : &str = "main";

pub async fn main_window_thread(
  app: AppHandle,
  app_data_root: AppDataRoot,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> ! {
  // TODO: Move these into some kind of dependency injection framework
  let window_size_slot: CloneSlot<MainWindowSize> = CloneSlot::empty();
  let window_pos_slot: CloneSlot<MainWindowPosition> = CloneSlot::empty();
  let app_startup_time = AppStartupTime::new();

  loop {
    for (window_name, window) in app.windows() {
      if window_name == MAIN_WINDOW_NAME {
        let result = handle_main_window(
          &app,
          &window,
          &app_data_root,
          &storyteller_creds_manager,
          &window_size_slot,
          &window_pos_slot,
          &app_startup_time,
        ).await;
        if let Err(err) = result {
          error!("Error handling main window: {:?}", err);
        }
      }
    }
    tokio::time::sleep(std::time::Duration::from_millis(1_000)).await;
  }
}

pub async fn handle_main_window(
  app: &AppHandle,
  window: &Window,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
  window_size_slot: &CloneSlot<MainWindowSize>,
  window_pos_slot: &CloneSlot<MainWindowPosition>,
  app_startup_time: &AppStartupTime,
) -> AnyhowResult<()> {
  loop {
    log_errors(persist_window_resize_task(window, app_data_root, window_size_slot).await);
    log_errors(persist_window_position_task(window, app_data_root, window_pos_slot).await);
    log_errors(persist_storyteller_cookies_task(app, storyteller_creds_manager, app_startup_time).await);
    tokio::time::sleep(std::time::Duration::from_millis(1_000)).await;
  }
}

pub fn log_errors<T>(result: AnyhowResult<T>) {
  if let Err(err) = result {
    error!("Error persisting window size: {:?}", err);
  }
}
