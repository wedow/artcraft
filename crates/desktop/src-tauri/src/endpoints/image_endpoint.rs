use crate::ml::model_cache::ModelCache;
use crate::ml::prompt_cache::PromptCache;
use crate::ml::stable_diffusion::stable_diffusion_pipeline::{stable_diffusion_pipeline, Args};
use crate::state::app_config::AppConfig;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use bytes::BytesMut;
use image::imageops::FilterType;
use image::{DynamicImage, ImageFormat, ImageReader};
use log::{error, info};
use std::io::Cursor;
use std::path::PathBuf;
use tauri::State;

const PROMPT_FILENAME : &str = "prompt.txt";
const PROMPT: &str = "A beautiful landscape with mountains and a lake";

const NEGATIVE_PROMPT: &str = "bad quality, bad faces, poor quality, blurry faces, watermark";

/// This handler takes an image (as a base64 encoded string) and a prompt and returns
/// an image (as a base64-encoded string).
#[tauri::command]
pub fn infer_image(
  image: &str,
  prompt: Option<String>,
  strength: Option<u8>,
  model_config: State<AppConfig>,
  model_cache: State<ModelCache>,
  prompt_cache: State<PromptCache>,
) -> Result<String, String> {

  let prompt = get_prompt_or_fallback(prompt);

  info!("Prompt: {}", prompt);

  let image = hydrate_base64_image(image)
    .map_err(|err| format!("Couldn't hydrate image from base64: {}", err))?;

  let result = do_infer_image(&prompt, image, strength, &model_config, &model_cache, prompt_cache);
  
  if let Err(err) = result.as_deref() {
    error!("There was an error: {:?}", err);
  }
  
  result
}

fn do_infer_image(
  prompt: &str,
  image: DynamicImage,
  strength: Option<u8>,
  config: &AppConfig,
  model_cache: &ModelCache,
  prompt_cache: State<PromptCache>,
) -> Result<String, String> {
  println!("infer_image called; generating image with SDXL Turbo...");
  
  let args = Args {
    image: &image,
    prompt: prompt.to_string(),
    uncond_prompt: NEGATIVE_PROMPT.to_string(),
    //guidance_scale: Some(0.0),
    model_cache,
    configs: config,
    prompt_cache: &prompt_cache,
    i2i_strength: strength,
    cfg_scale: config.cfg_scale,
  };

  match stable_diffusion_pipeline(args) {
    Ok(image) => {
      let mut bytes = Vec::with_capacity(1024*1024);
      
      image.write_to(&mut Cursor::new(&mut bytes), ImageFormat::Png)
        .map_err(|err| format!("failure to encode image: {:?}", err))?;

      let bytes = BASE64_STANDARD.encode(bytes);

      Ok(bytes)
    },
    Err(e) => Err(format!("Failed to generate image: {}", e)),
  }
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

fn hydrate_base64_image(base64_image: &str) -> anyhow::Result<DynamicImage> {
  let bytes = BASE64_STANDARD.decode(base64_image)?;

  let image = ImageReader::new(Cursor::new(bytes))
    .with_guessed_format()?
    .decode()?;

  // TODO(bt,2025-02-17): Running out of vram with full image buffer size
  let image = image.resize(512, 512, FilterType::CatmullRom);

  Ok(image)
}
