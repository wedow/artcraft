use crate::endpoints::sd::{run, Args};
use crate::state::yaml_config::YamlConfig;
use crate::ml::model_cache::ModelCache;
use crate::ml::prompt_cache::PromptCache;
use crate::state::app_config::AppConfig;
use anyhow::Result;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use image::imageops::FilterType;
use image::ImageReader;
use log::error;
use std::io::Cursor;
use std::path::PathBuf;
use tauri::State;

const PROMPT: &str = "A beautiful landscape with mountains and a lake";

#[tauri::command]
pub fn infer_image(
  image: &str,
  model_config: State<AppConfig>,
  model_cache: State<ModelCache>,
  prompt_cache: State<PromptCache>,
) -> Result<String, String> {

  let bytes = BASE64_STANDARD.decode(image)
    .map_err(|err| format!("Base64 decode error: {}", err))?;
  
  let prompt_file = PathBuf::from("prompt.txt").canonicalize()
    .unwrap_or_else(|_| PathBuf::from("prompt.txt"));
  
  let prompt = std::fs::read_to_string(&prompt_file)
    .map_err(|err| format!("Failed to read prompt file: {}", err))
    .unwrap_or_else(|_| {
      error!("Failed to read prompt file: {:?}", prompt_file);
      PROMPT.to_string()
    })
    .trim()
    .to_string();

  let image = ImageReader::new(Cursor::new(bytes))
    .with_guessed_format()
    .map_err(|err| format!("Image format error: {}", err))?
    .decode()
    .map_err(|err| format!("Image decode error: {}", err))?;
  
  // TODO(bt,2025-02-17): Running out of vram with full image buffer size
  let image = image.resize(512, 512, FilterType::CatmullRom);
  
  // TODO(bt,2025-02-14): Use byte buffers instead of hitting the filesystem.
  let image_path = PathBuf::from("input_image.png");
  
  image.save(&image_path)
    .map_err(|err| format!("Failed to save image: {}", err))?;
  
  let result = do_infer_image(&prompt, &image_path, &model_config, &model_cache, prompt_cache);
  
  if let Err(err) = result.as_deref() {
    error!("There was an error: {:?}", err);
  }
  
  result
}

fn do_infer_image(
  prompt: &str,
  image_path: &PathBuf,
  config: &AppConfig,
  model_cache: &ModelCache,
  prompt_cache: State<PromptCache>,
) -> Result<String, String> {
  println!("infer_image called; generating image with SDXL Turbo...");
  
  let args = Args {
    image_path,
    prompt: prompt.to_string(),
    uncond_prompt: "".to_string(),
    //guidance_scale: Some(0.0),
    guidance_scale: None,
    model_cache,
    configs: config,
    prompt_cache: &prompt_cache,
  };

  match run(args) {
    Ok(_) => {
      let img_data = std::fs::read("temp.png")
        .map_err(|e| format!("Failed to read generated image: {}", e))?;
        
      let encoded = BASE64_STANDARD.encode(&img_data);
      println!("Generated image encoded successfully");

      let _ = std::fs::remove_file("temp.png");

      Ok(encoded)
    }
    Err(e) => Err(format!("Failed to generate image: {}", e))
  }
}
