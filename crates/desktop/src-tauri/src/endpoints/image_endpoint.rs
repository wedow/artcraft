use crate::endpoints::sd::{run, Args};
use crate::ml::model_cache::ModelCache;
use crate::model_config::ModelConfig;
use anyhow::Result;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use once_cell::sync::Lazy;
use std::sync::{Arc, Mutex, RwLock};
use tauri::State;

const PROMPT: &str = "A beautiful landscape with mountains and a lake";

const HEIGHT: usize = 512;
const WIDTH: usize = 512;

static MODEL_CACHE: Lazy<Arc<RwLock<Option<ModelCache>>>> = Lazy::new(|| Arc::new(RwLock::new(None)));

#[tauri::command]
pub fn infer_image(image: &str, model_config: State<ModelConfig>) -> Result<String, String> {
    do_infer_image(image, &model_config)
}

fn do_infer_image(image: &str, config: &ModelConfig) -> Result<String, String> {
    println!("infer_image called; generating image with SDXL Turbo...");
    
    // TODO(bt,2025-02-14): Clean this up.
    match MODEL_CACHE.write() {
        Err(err) => return Err(err.to_string()),
        Ok(mut maybe_cache) => {
            match &*maybe_cache {
                None => {
                    let cache = ModelCache::new(
                        config.device.clone(), 
                        config.dtype, 
                        config.sd_version.clone(), 
                        config.sd_config.clone()
                    ).map_err(|err| err.to_string())?;

                    *maybe_cache = Some(cache);
                }
                Some(_model) => {
                    println!("Model cache already exists");
                }
            }

        }
    }
    
    match MODEL_CACHE.read() {
        Err(err) => return Err(err.to_string()),
        Ok(maybe_model) => {
            match &*maybe_model {
                None => {
                    Err("model does not exist".to_string())
                }
                Some(model_cache) => {
                    let args = Args {
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
            }
        }
    }
    
}
