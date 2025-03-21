use crate::ml::model_cache::ModelCache;
use crate::ml::prompt_cache::PromptCache;
use crate::ml::stable_diffusion::lcm_pipeline::{lcm_pipeline, Args};
use crate::state::app_config::AppConfig;
use crate::state::app_dir::AppDataRoot;
use crate::utils::image::decode_base64_image::decode_base64_image;
use crate::utils::image::encode_rgb_image_base64_png::encode_rgb_image_base64_png;
use image::imageops::FilterType;
use image::{DynamicImage, RgbImage};
use log::{error, info};
use std::path::PathBuf;
use tauri::{AppHandle, State};

const PROMPT_FILENAME : &str = "prompt.txt";
const PROMPT: &str = "shiba inu, cute dog, detailed, walking in a wooded forest, photorealistic, 8k";

const NEGATIVE_PROMPT: &str = "bad quality, bad faces, poor quality, blurry faces, watermark";

const RANDOM_SEED: u32 = 42;


/// This handler takes an image (as a base64 encoded string) and a prompt and returns
/// an image (as a base64-encoded string).
#[tauri::command]
pub async fn infer_image(
  image: &str,
  prompt: Option<String>,
  strength: Option<f64>,
  model_config: State<'_, AppConfig>,
  model_cache: State<'_, ModelCache>,
  prompt_cache: State<'_, PromptCache>,
  app_data_root: State<'_, AppDataRoot>,
  app: AppHandle,
) -> Result<String, String> {
  info!("infer_image endpoint called.");

  let prompt = get_prompt_or_fallback(prompt);

  info!("Strength: {:?}; Prompt: {}", strength, prompt);

  let image = decode_base64_image(image)
    .map_err(|err| format!("Couldn't hydrate image from base64: {}", err))?;
  
  // TODO(bt,2025-02-17): Running out of vram with full image buffer size
  let image = image.resize(512, 512, FilterType::CatmullRom);

  let result = do_infer_image(
    &prompt, 
    image, 
    strength, 
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
    uncond_prompt: NEGATIVE_PROMPT.to_string(),
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

fn get_prompt_or_fallback(user_prompt: Option<String>) -> String {
  let user_prompt = user_prompt.map(|prompt| prompt.trim().to_string())
    .filter(|prompt| !prompt.is_empty());

  if let Some(prompt) = user_prompt {
    return prompt;
  }

  let prompt_file = PathBuf::from(PROMPT_FILENAME)
    .canonicalize()
    .unwrap_or_else(|_| PathBuf::from(PROMPT_FILENAME));

  std::fs::read_to_string(&prompt_file)
    .map_err(|err| format!("Failed to read prompt file: {}", err))
    .unwrap_or_else(|_| {
      error!("Failed to read prompt file: {:?}", prompt_file);
      PROMPT.to_string()
    })
    .trim()
    .to_string()
}
