pub mod commands;
pub mod events;
pub mod state;
pub mod threads;
pub mod utils;

use crate::commands::flip_image::flip_image;
use crate::commands::sora::open_sora_login_command::open_sora_login_command;
use crate::commands::sora::sora_image_generation_command::sora_image_generation_command;
use crate::commands::sora::sora_image_remix_command::sora_image_remix_command;
use crate::state::app_config::AppConfig;
use crate::state::sora::sora_credential_manager::SoraCredentialManager;
use crate::threads::sora_session_login_thread::sora_session_login_thread;

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
  let app_data_root2 = config.app_data_root.clone();

  println!("Attempting to read existing credentials...");
  let sora_creds_manager = SoraCredentialManager::initialize_from_disk_infallible(&app_data_root);
  let sora_creds_manager2 = sora_creds_manager.clone();

  println!("Initializing backend runtime...");

  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new()
      .level(log::LevelFilter::Info)
      .targets(vec![
        Target::new(TargetKind::Stdout),
        Target::new(TargetKind::LogDir {
          file_name: Some(app_data_root.log_file_name_str().to_string())
        }),
      ])
      .build())
    .setup(|app| {
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

      tauri::async_runtime::spawn(sora_session_login_thread(app, app_data_root2, sora_creds_manager2));

      Ok(())
    })
    .manage(config)
    .manage(app_data_root)
    .manage(sora_creds_manager)
    .invoke_handler(tauri::generate_handler![
      flip_image,
      open_sora_login_command,
      sora_image_generation_command,
      sora_image_remix_command,
    ])
    .run(tauri::generate_context!("tauri.conf.json"))
    .expect("error while running tauri application");
}
