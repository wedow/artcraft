use std::io::Cursor;
use std::path::PathBuf;
use crate::endpoints::sd::{run, Args};
use crate::ml::model_cache::ModelCache;
use crate::model_config::ModelConfig;
use anyhow::Result;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use image::ImageReader;
use tauri::State;

const PROMPT: &str = "A beautiful landscape with mountains and a lake";

const HEIGHT: usize = 512;
const WIDTH: usize = 512;

#[tauri::command]
pub fn infer_image(image: &str, model_config: State<ModelConfig>, model_cache: State<ModelCache>) -> Result<String, String> {

  let bytes = BASE64_STANDARD.decode(image)
    .map_err(|err| format!("Base64 decode error: {}", err))?;

  let image = ImageReader::new(Cursor::new(bytes))
    .with_guessed_format()
    .map_err(|err| format!("Image format error: {}", err))?
    .decode()
    .map_err(|err| format!("Image decode error: {}", err))?;
  
  // TODO(bt,2025-02-14): Use byte buffers instead of hitting the filesystem.
  let image_path = PathBuf::from("input_image.png");
  
  image.save(&image_path)
    .map_err(|err| format!("Failed to save image: {}", err))?;
  
  do_infer_image(&image_path, &model_config, &model_cache)
}

fn do_infer_image(image_path: &PathBuf, config: &ModelConfig, model_cache: &ModelCache) -> Result<String, String> {
  println!("infer_image called; generating image with SDXL Turbo...");
  
  let args = Args {
    image_path,
    api: config.hf_api.clone(),
    prompt: PROMPT.to_string(),
    uncond_prompt: "".to_string(),
    cpu: config.device.is_cpu(),
    height: Some(HEIGHT),
    width: Some(WIDTH),
    n_steps: Some(1),
    num_samples: 1,
    seed: None,
    sd_version: config.sd_version.clone(),
    guidance_scale: Some(0.0),
    model_cache,
    model_configs: config,
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
