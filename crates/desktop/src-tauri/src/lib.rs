pub mod endpoints;
pub mod ml;
pub mod state;

use crate::ml::model_cache::ModelCache;
use crate::ml::prompt_cache::PromptCache;
use crate::state::app_config::AppConfig;
use endpoints::image_endpoint::infer_image;
use endpoints::test_counter::test_counter;
use tauri_plugin_log::Target;
use tauri_plugin_log::TargetKind;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // NB: Tauri wants to install the logger itself, so we can't rely on the logger crate 
  // until the tauri runtime begins.
  println!("Loading model config...");

  let config = AppConfig::init()
    .expect("config should load");

  let prompt_cache = PromptCache::with_capacity(8)
    .expect("prompt cache should load");

  println!("Creating model cache...");
  
  let model_cache = ModelCache::new(
    config.device.clone(),
    config.dtype,
    config.sd_version.clone(),
    config.sd_config.clone()
  ).expect("Model cache should create");

  println!("Initializing backend runtime...");

  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new()
      .level(log::LevelFilter::Info)
      .targets(vec![Target::new(TargetKind::Stdout)])
      .build())
    .setup(|app| {
      //if cfg!(debug_assertions) {
      //  app.handle().plugin(
      //    tauri_plugin_log::Builder::default()
      //      .level(log::LevelFilter::Info)
      //      .build(),
      //  )?;
      //}
      Ok(())
    })
    .manage(config)
    .manage(prompt_cache)
    .manage(model_cache)
    .invoke_handler(tauri::generate_handler![
      test_counter, 
      infer_image,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
