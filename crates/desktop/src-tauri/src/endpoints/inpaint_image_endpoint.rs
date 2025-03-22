use crate::ml::model_cache::ModelCache;
use crate::ml::prompt_cache::PromptCache;
use crate::state::app_config::AppConfig;
use crate::state::app_dir::AppDataRoot;
use image::{ImageReader, RgbImage};
use log::info;
use tauri::{AppHandle, State};


#[tauri::command]
pub async fn inpaint_image(
  image: &str,
  mask: &str,
  prompt: String,
  model_config: State<'_, AppConfig>,
  model_cache: State<'_, ModelCache>,
  prompt_cache: State<'_, PromptCache>,
  app_data_root: State<'_, AppDataRoot>,
  app: AppHandle,
) -> Result<String, String> {
  info!("inpaint_endpoint endpoint called.");

  Ok(mask.to_string())
}
