mod image_endpoint;

use std::sync::{Arc, RwLock};
use once_cell::sync::Lazy;
use image_endpoint::infer_image;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      my_custom_command, 
      test_round_trip, 
      infer_image,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn my_custom_command() {
  println!("I was invoked from JavaScript!");
}

static COUNTER : Lazy<Arc<RwLock<u64>>> = Lazy::new(|| Arc::new(RwLock::new(0)));

#[tauri::command]
fn test_round_trip() -> u64 {
  let value : u64;
  {
    match COUNTER.write() {
      Ok(mut counter) => {
        *counter += 1;
        value = *counter;
      },
      Err(_e) => {
        value = 0;
      }
    }
  }

  println!("I was invoked from JavaScript! {:?}", value);

  value
}

