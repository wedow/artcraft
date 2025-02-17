pub mod ml;
pub mod endpoints;
pub mod model_config;

use crate::ml::model_cache::ModelCache;
use crate::ml::prompt_cache::PromptCache;
use crate::model_config::ModelConfig;
use endpoints::image_endpoint::infer_image;
use env_logger;
use log::info;
use once_cell::sync::Lazy;
use std::sync::{Arc, RwLock};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  env_logger::init();

  info!("Loading model config...");

  let model_config = ModelConfig::init()
    .expect("config should load");

  let prompt_cache = PromptCache::with_capacity(8)
    .expect("prompt cache should load");

  info!("Creating model cache...");
  
  let model_cache = ModelCache::new(
    model_config.device.clone(),
    model_config.dtype,
    model_config.sd_version.clone(),
    model_config.sd_config.clone()
  ).expect("Model cache should create");

  info!("Initializing backend runtime...");

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
    .manage(model_config)
    .manage(prompt_cache)
    .manage(model_cache)
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

