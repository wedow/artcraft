use crate::ml::model_cache::ModelCache;
use crate::ml::prompt_cache::PromptCache;
use crate::ml::stable_diffusion::lcm_pipeline::{lcm_pipeline, Args};
use crate::state::app_config::AppConfig;
use crate::state::app_dir::AppDataRoot;
use crate::utils::image::decode_base64_image::decode_base64_image;
use crate::utils::image::encode_rgb_image_base64_png::encode_rgb_image_base64_png;
use image::imageops::FilterType;
use image::{DynamicImage, ImageReader, RgbImage};
use log::{error, info};
use once_cell::sync::Lazy;
use std::io::Cursor;
use std::path::PathBuf;
use tauri::{AppHandle, State};

const RANDOM_SEED: u32 = 42;

const STRENGTH: f64 = 1.0;
const PNG_BYTES : &[u8] = include_bytes!("../../binary_includes/1024.png");

// NB: We're just hacking a temporary "text to image" test endpoint leveraging the existing image to image modality.
static IMAGE : Lazy<DynamicImage> = Lazy::new(||{
  ImageReader::new(Cursor::new(PNG_BYTES))
    .with_guessed_format()
    .expect("failed to detect png format")
    .decode()
    .expect("failed to decode image")
});

#[tauri::command]
pub async fn text_to_image(
  prompt: String,
  model_config: State<'_, AppConfig>,
  model_cache: State<'_, ModelCache>,
  prompt_cache: State<'_, PromptCache>,
  app_data_root: State<'_, AppDataRoot>,
  app: AppHandle,
) -> Result<String, String> {
  info!("text_to_image endpoint called.");

  let image = IMAGE.resize(512, 512, FilterType::CatmullRom);

  let result = do_infer_image(
    &prompt, 
    image, 
    Some(STRENGTH), 
    &model_config, 
    &model_cache, 
    prompt_cache, 
    app, 
    &app_data_root
  ).await;
  
  let image = match result {
    Ok(image) => image,
    Err(err) => {
      error!("There was an error generating the image: {:?}", err);
      return Err(format!("There was an error generating the image: {}", err));
    }
  };

  let bytes = encode_rgb_image_base64_png(image)
    .map_err(|err| format!("failure to encode image: {:?}", err))?;

  info!("Inference successful; image converted to base64, serving back to browser...");

  Ok(bytes)
}

async fn do_infer_image(
  prompt: &str,
  image: DynamicImage,
  strength: Option<f64>,
  config: &AppConfig,
  model_cache: &ModelCache,
  prompt_cache: State<'_, PromptCache>,
  app: AppHandle,
  app_data_root: &AppDataRoot,
) -> Result<RgbImage, String> {

  let args = Args {
    image: &image,
    prompt: prompt.to_string(),
    uncond_prompt: "".to_string(),
    model_cache,
    configs: config,
    prompt_cache: &prompt_cache,
    i2i_strength: strength,
    cfg_scale: config.cfg_scale,
    app: &app,
    app_data_root,
    use_flash_attn: true,
  };

  let image = lcm_pipeline(args)
    .map_err(|err| format!("failure to encode image: {:?}", err))?;

  Ok(image)
}
