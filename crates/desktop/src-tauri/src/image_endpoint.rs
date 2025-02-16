use anyhow::Result;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use std::io::Cursor;
use crate::sd::{self, StableDiffusionVersion, Args};
use candle_core::Device;
use log::{info, warn, error};

const PROMPT: &str = "A beautiful landscape with mountains and a lake";

#[tauri::command]
pub fn infer_image(image: &str) -> Result<String, String> {
    info!("infer_image called; generating image with SDXL Turbo...");
    
    // Check CUDA availability
    let use_cpu = match Device::new_cuda(0) {
        Ok(_) => {
            info!("CUDA device available");
            false
        }
        Err(e) => {
            warn!("CUDA not available ({}), falling back to CPU", e);
            true
        }
    };
    let decoded = BASE64_STANDARD.decode(&image).unwrap();
    // write mask.png


    std::fs::write("/tmp/mask.png", decoded).expect("Unable to write file");
    let args = Args {
        prompt: PROMPT.to_string(),
        uncond_prompt: "".to_string(),
        cpu: use_cpu,
        height: Some(512),
        width: Some(512),
        n_steps: Some(25),
        num_samples: 1,
        seed: None,
        sd_version: StableDiffusionVersion::Turbo,
        guidance_scale: Some(0.0),
        img2img: Some("/tmp/mask.png".to_string()),
        use_f16: true,
    };

    match sd::run(args) {
        Ok(_) => {
            match std::fs::read("temp.png") {
                Ok(img_data) => {
                    let encoded = BASE64_STANDARD.encode(&img_data);
                    info!("Generated image encoded successfully");
                    
                    if let Err(e) = std::fs::remove_file("temp.png") {
                        warn!("Failed to remove temp.png: {}", e);
                    }
                    
                    Ok(encoded)
                },
                Err(e) => {
                    error!("Failed to read generated image: {}", e);
                    Err(format!("Failed to read generated image: {}", e))
                }
            }
        }
        Err(e) => {
            error!("Failed to generate image: {}", e);
            Err(format!("Failed to generate image: {}", e))
        }
    }
}
