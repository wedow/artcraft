pub mod commands;
pub mod events;
pub mod state;
pub mod threads;
pub mod utils;

use tauri::Manager;

use crate::commands::flip_image::flip_image;
use crate::commands::platform_info_command::platform_info_command;
use crate::commands::sora::open_sora_login_command::open_sora_login_command;
use crate::commands::sora::sora_image_generation_command::sora_image_generation_command;
use crate::commands::sora::sora_image_remix_command::sora_image_remix_command;
use crate::state::app_config::AppConfig;
use crate::state::main_window_size::MainWindowSize;
use crate::state::sora::sora_credential_manager::SoraCredentialManager;
use crate::utils::webview_unsafe::webview_unsafe_for_app;
use crate::state::sora::sora_task_queue::SoraTaskQueue;
use crate::state::storyteller::storyteller_credential_manager::StorytellerCredentialManager;
use crate::threads::discord_presence_thread::discord_presence_thread;
use crate::threads::main_window_thread::main_window_thread::main_window_thread;
use crate::threads::sora_session_login_thread::sora_session_login_thread;
use crate::threads::sora_task_polling_thread::sora_task_polling_thread;

use tauri_plugin_http;
use tauri_plugin_log::Target;
use tauri_plugin_log::TargetKind;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // NB: Tauri wants to install the logger itself, so we can't rely on the logger crate
  // until the tauri runtime begins.
  println!("Loading model config...");

  let config = AppConfig::init()
    .expect("config should load");

  let app_data_root = config.app_data_root.clone();
  let app_data_root_2 = config.app_data_root.clone();

  println!("Attempting to read existing artcraft credentials...");
  let storyteller_creds_manager = StorytellerCredentialManager::initialize_from_disk_infallible(&app_data_root);
  let storyteller_creds_manager_2 = storyteller_creds_manager.clone();
  
  println!("Attempting to read existing credentials...");
  let sora_creds_manager = SoraCredentialManager::initialize_from_disk_infallible(&app_data_root);
  let sora_creds_manager_2 = sora_creds_manager.clone();

  // Other state
  let sora_task_queue = SoraTaskQueue::new();
  let sora_task_queue_2 = sora_task_queue.clone();

  println!("Initializing backend runtime...");

  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_upload::init())
    .plugin(tauri_plugin_log::Builder::new()
      .level(log::LevelFilter::Info)
      .targets(vec![
        Target::new(TargetKind::Stdout),
        Target::new(TargetKind::LogDir {
          file_name: Some(app_data_root.log_file_name_str().to_string())
        }),
      ])
      .build())
    .setup(move |app| {
      // TODO(bt): This is broken on windows
      // log_environment_details();

      //if cfg!(debug_assertions) {
      //  app.handle().plugin(
      //    tauri_plugin_log::Builder::default()
      //      .level(log::LevelFilter::Info)
      //      .build(),
      //  )?;
      //}
      let app = app.handle().clone();
      
      let result = webview_unsafe_for_app(&app);
      if let Err(err) = result {
        eprintln!("Error setting webview unsafe: {:?}", err);
      }

      let app_2 = app.clone();
      let app_3 = app.clone();
      let app_data_root_3 = app_data_root_2.clone();
      let app_data_root_4 = app_data_root_2.clone();
      let sora_creds_manager_3 = sora_creds_manager_2.clone();
      let storyteller_creds_manager_3 = storyteller_creds_manager.clone();

      match MainWindowSize::from_filesystem_configs(&app_data_root_3) {
        Ok(None) => {}
        Ok(Some(size)) => {
          println!("Resizing window to: {:?}", size);
          let result = size.apply_to_main_window(&app);
          if let Err(err) = result {
            eprintln!("Could not set window size: {:?}", err);
          }
        }
        Err(err) => {
          eprintln!("Failed to read window size from disk: {:?}", err);
        }
      }

      tauri::async_runtime::spawn(sora_session_login_thread(app_2, app_data_root_2, sora_creds_manager_2));
      tauri::async_runtime::spawn(main_window_thread(app_3, app_data_root_3, storyteller_creds_manager_2));
      tauri::async_runtime::spawn(sora_task_polling_thread(app_data_root_4, sora_creds_manager_3, storyteller_creds_manager_3, sora_task_queue_2));
      tauri::async_runtime::spawn(discord_presence_thread());

      Ok(())
    })
    .manage(app_data_root)
    .manage(config)
    .manage(sora_creds_manager)
    .manage(sora_task_queue)
    .invoke_handler(tauri::generate_handler![
      flip_image,
      open_sora_login_command,
      platform_info_command,
      sora_image_generation_command,
      sora_image_remix_command,
    ])
    .run(tauri::generate_context!("tauri.conf.json"))
    .expect("error while running tauri application");
}
