use std::env::args;
use std::sync::{Arc, RwLock};
use crate::model::model_file::StableDiffusionVersion;
use crate::sd::{self, Args};
use anyhow::Result;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use candle_core::{DType, Device};
use candle_transformers::models::stable_diffusion;
use once_cell::sync::Lazy;
use crate::ml::model_cache::ModelCache;
use crate::ml::models::unet_model::UNetModel;

const PROMPT: &str = "A beautiful landscape with mountains and a lake";

const HEIGHT: usize = 512;
const WIDTH: usize = 512;

static MODEL_CACHE: Lazy<Arc<RwLock<Option<ModelCache>>>> = Lazy::new(|| Arc::new(RwLock::new(None)));

#[tauri::command]
pub fn infer_image(image: &str) -> Result<String, String> {
    println!("infer_image called; generating image with SDXL Turbo...");
    
    // Check CUDA availability
    let use_cpu = match Device::new_cuda(0) {
        Ok(_) => {
            println!("CUDA device available");
            false
        }
        Err(e) => {
            println!("CUDA not available ({}), falling back to CPU", e);
            true
        }
    };
    
    let sd_version = StableDiffusionVersion::Turbo;

    let sd_config = match sd_version {
        StableDiffusionVersion::Turbo => {
            println!("Configuring SDXL Turbo");
            stable_diffusion::StableDiffusionConfig::sdxl_turbo(None, Some(HEIGHT), Some(WIDTH))
        }
        _ => {
            println!("Configuring SD v2.1");
            stable_diffusion::StableDiffusionConfig::v2_1(None, Some(HEIGHT), Some(WIDTH))
        }
    };
    
    let api = hf_hub::api::sync::Api::new()
      .map_err(|err| err.to_string())?;

    let dtype = DType::F32;

    match MODEL_CACHE.write() {
        Err(err) => return Err(err.to_string()),
        Ok(mut maybe_cache) => {
            match &*maybe_cache {
                None => {
                    let device = if use_cpu {
                        println!("Using CPU for computation");
                        Device::Cpu
                    } else {
                        println!("Attempting to use CUDA device");
                        match Device::new_cuda(0) {
                            Ok(cuda_device) => {
                                println!("Successfully initialized CUDA device");
                                cuda_device
                            }
                            Err(e) => {
                                println!("Failed to initialize CUDA device: {}. Falling back to CPU", e);
                                Device::Cpu
                            }
                        }
                    };
                    
                    let cache = ModelCache::new(device, dtype, sd_version.clone(), sd_config.clone())
                      .map_err(|err| err.to_string())?;

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
                        api,
                        prompt: PROMPT.to_string(),
                        uncond_prompt: "".to_string(),
                        cpu: use_cpu,
                        height: Some(HEIGHT),
                        width: Some(WIDTH),
                        n_steps: Some(1),
                        num_samples: 1,
                        seed: None,
                        sd_version,
                        guidance_scale: Some(0.0),
                        model_cache,
                    };

                    match sd::run(args) {
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
