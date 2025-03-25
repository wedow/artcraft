//! Adapted from https://github.com/dnanhkhoa/rust-background-removal

use crate::state::app_dir::AppDataRoot;
use crate::utils::image::decode_base64_image::decode_base64_image;
use crate::utils::image::encode_dynamic_image_base64_png::encode_dynamic_image_base64_png;
use image::{imageops, DynamicImage};
use log::{error, info};
use ml_models::ml::background_removal::onnx_session::onnx_session;
use ml_models::ml::background_removal::remove_image_background::remove_image_background;
use ml_models::ml::model_cache::ModelCache;
use ml_models::ml::weights_registry::weights::{DIS_MEDIUM_ONNX, SIMIANLUO_LCM_DREAMSHAPER_V7_UNET};
use tauri::{AppHandle, State};

/// This handler removes the background from an image.
#[tauri::command]
pub async fn remove_background(
  image: &str,
  model_cache: State<'_, ModelCache>,
  app_data_root: State<'_, AppDataRoot>,
  app: AppHandle,
) -> Result<String, String> {
  info!("remove_background endpoint called.");

  let image = decode_base64_image(image)
    .map_err(|err| format!("Couldn't hydrate image from base64: {}", err))?;

  let model_path = app_data_root.weights_dir().weight_path(&DIS_MEDIUM_ONNX);
  
  let image = remove_image_background(model_path, image)
    .await
    .map_err(|err| format!("Couldn't remove image from image: {}", err))?;

  let image = encode_dynamic_image_base64_png(image)
    .map_err(|err| format!("failure to encode image: {:?}", err))?;

  Ok(image)
}
