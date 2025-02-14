use crate::model::model_file::StableDiffusionVersion;
use crate::sd::{self, Args};
use anyhow::Result;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use candle_core::Device;

const PROMPT: &str = "A beautiful landscape with mountains and a lake";

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
    
    let args = Args {
        prompt: PROMPT.to_string(),
        uncond_prompt: "".to_string(),
        cpu: use_cpu,
        height: Some(512),
        width: Some(512),
        n_steps: Some(1),
        num_samples: 1,
        seed: None,
        sd_version: StableDiffusionVersion::Turbo,
        guidance_scale: Some(0.0),
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
