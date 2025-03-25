use crate::state::app_config::AppConfig;
use crate::state::app_dir::AppDataRoot;
use crate::utils::image::decode_base64_image::decode_base64_image;
use crate::utils::image::encode_rgb_image_base64_png::encode_rgb_image_base64_png;
use image::imageops::FilterType;
use image::{DynamicImage, ImageReader, RgbImage};
use log::{error, info};
use ml_models::ml::model_cache::ModelCache;
use ml_models::ml::prompt_cache::PromptCache;
use ml_models::ml::stable_diffusion::lcm_pipeline::{lcm_pipeline, Args};
use once_cell::sync::Lazy;
use std::io::Cursor;
use std::path::PathBuf;
use tauri::{AppHandle, State};
use ml_models::ml::weights_registry::weights::{CLIP_JSON, LYKON_DEAMSHAPER_7_TEXT_ENCODER_FP16, LYKON_DEAMSHAPER_7_VAE, SDXL_TURBO_CLIP_TEXT_ENCODER, SIMIANLUO_LCM_DREAMSHAPER_V7_UNET};

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
  
  let weights_dir = app_data_root.weights_dir();
  let vae_path = weights_dir.weight_path(&LYKON_DEAMSHAPER_7_VAE);
  let unet_path = weights_dir.weight_path(&SIMIANLUO_LCM_DREAMSHAPER_V7_UNET);
  let clip_json_path = weights_dir.weight_path(&CLIP_JSON);
  let clip_weights_path= weights_dir.weight_path(&SDXL_TURBO_CLIP_TEXT_ENCODER);

  let args = Args {
    image: &image,
    prompt: prompt.to_string(),
    uncond_prompt: "".to_string(),
    model_cache,
    prompt_cache: &prompt_cache,
    img2img_strength: strength,
    cfg_scale: config.cfg_scale,
    use_flash_attn: true,
    model_config: &config.model_config,
    maybe_seed: None,
    scheduler_steps: config.scheduler_steps,
    vae_path: &vae_path,
    unet_path: &unet_path,
    clip_json_path: &clip_json_path,
    clip_weights_path: &clip_weights_path,
  };

  let image = lcm_pipeline(args)
    .map_err(|err| format!("failure to encode image: {:?}", err))?;

  Ok(image)
}
