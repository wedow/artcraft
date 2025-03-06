use std::sync::{Arc, RwLock, RwLockReadGuard, RwLockWriteGuard};

use crate::events::notification_event::{ModelType, NotificationEvent};
use crate::ml::image::dynamic_image_to_tensor::dynamic_image_to_tensor;
use crate::ml::image::tensor_to_image_buffer::{tensor_to_image_buffer, RgbImage};
use crate::ml::model_cache::ModelCache;
use crate::ml::model_file::StableDiffusionVersion;
use crate::ml::model_registry::ModelRegistry;
use crate::ml::models::unet_model::UNetModel;
use crate::ml::prompt_cache::PromptCache;
use crate::ml::stable_diffusion::get_vae_scale::get_vae_scale;
use crate::ml::stable_diffusion::infer_clip_text_embeddings::infer_clip_text_embeddings;
use crate::state::app_config::AppConfig;
use anyhow::{anyhow, Error as E, Result};
use candle_core::{DType, IndexOp, Tensor, D};
use candle_transformers::models::stable_diffusion::vae::{AutoEncoderKL, DiagonalGaussianDistribution};
use candle_transformers::models::stable_diffusion::lcm::LCMScheduler;
use image::DynamicImage;
use log::info;
use rand::Rng;
use tauri::{AppHandle, Emitter};

pub struct Args<'a> {
    pub image: &'a DynamicImage,
    pub prompt: String,
    pub uncond_prompt: String,
    pub cfg_scale: Option<f64>,
    pub i2i_strength: Option<u8>,
    pub configs: &'a AppConfig,
    pub model_cache: &'a ModelCache,
    pub prompt_cache: &'a PromptCache,
    pub app: &'a AppHandle,
}

pub fn lcm_pipeline(args: Args<'_>) -> Result<RgbImage> {
    let Args { 
        prompt, 
        uncond_prompt, 
        cfg_scale, 
        i2i_strength, 
        configs, 
        model_cache, 
        prompt_cache, 
        app, 
        image,  
    } = args;
    
    println!("Starting image generation with the following configuration:");
    println!("  Model: {:?}", configs.sd_version);
    println!("  Prompt: {}", prompt);
    println!("  Steps: {}", configs.scheduler_steps);
    println!("  Device: {:?}", configs.device);

    println!("Model dimensions: {}x{}", configs.sd_config.width, configs.sd_config.height);

    // Use LCM Scheduler instead of Euler Ancestral for better speed and quality
    let mut scheduler = LCMScheduler::new(
        configs.scheduler_steps,
        candle_transformers::models::stable_diffusion::lcm::LCMSchedulerConfig::default(),
    )?;

    let seed = configs.seed.unwrap_or_else(|| rand::thread_rng().gen());
    configs.device.set_seed(seed)?;

    info!("Using seed: {}", seed);

    let guidance_scale = match cfg_scale {
        Some(guidance_scale) => guidance_scale,
        None => match configs.sd_version {
            StableDiffusionVersion::V1_5
            | StableDiffusionVersion::V2_1
            | StableDiffusionVersion::Xl => 7.5,
            StableDiffusionVersion::Turbo => 0.,
            _ => 0., // NB: Not sure what the other model families should use, so sticking with "0"
        },
    };

    let use_guide_scale = guidance_scale > 1.0;

    info!("Using guide scale: {}", use_guide_scale);

    info!("Checking if prompt is cached");
    let maybe_cached = prompt_cache.get_copy(&prompt)?;

    let mut text_embeddings = if let Some(tensor) = maybe_cached {
        tensor
    } else {
        
        info!("Prompt is NOT cached! Calculating embedding...");
        let tensor = infer_clip_text_embeddings(
            &prompt,
            &uncond_prompt,
            None, // tokenizer
            None, // clip_weights
            None, // clip2_weights
            configs.sd_version,
            &configs.sd_config,
            false, // use_f16
            &configs.device,
            configs.dtype,
            use_guide_scale,
        )?;
        prompt_cache.store_copy(&prompt, &tensor)?;
        tensor
    };

    println!("Text embeddings shape: {:?}", text_embeddings.shape());

    println!("Loading input image into tensor...");

    let input_image = dynamic_image_to_tensor(
        image,
        &configs.device,
        configs.dtype)?;

    println!("Reference image shape: {:?}", input_image.shape());

    let vae_scale = get_vae_scale(configs.sd_version);

    let maybe_vae = model_cache.get_vae()?;
    
    let vae = match maybe_vae {
        Some(vae) => vae,
        None => {
            info!("No vae found in cache; loading...");
            
            let repo = configs.sd_version.repo();

            println!("Building VAE model from : {:?} ... (3)", repo);

            let vae_file = configs.hf_api.model(repo.to_string())
              .get("vae/diffusion_pytorch_model.safetensors")?;

            println!("Building VAE model from file {:?}...", &vae_file);

            let mut notify_download_complete = false;
            //if !vae_file.exists() {
            if true {
                notify_download_complete = true;
                app.emit("notification", NotificationEvent::ModelDownloadStarted {
                    model_name: repo,
                    model_type: ModelType::Vae,
                })?;
            }
            
            let vae = configs
              .sd_config
              .build_vae(vae_file, &configs.device, configs.dtype)?;

            let vae = Arc::new(vae);
            
            model_cache.set_vae(vae.clone())?;
            
            if notify_download_complete {
                app.emit("notification", NotificationEvent::ModelDownloadComplete {
                    model_name: repo,
                    model_type: ModelType::Vae,
                })?;
            }
            
            vae
        }
    };

    let maybe_unet = model_cache.get_unet()?;

    let unet = match maybe_unet {
        Some(unet) => unet,
        None => {
            info!("No unet found in cache; loading...");

            let mut notify_download_complete = false;
            //if !unet_file.exists() {
            if true {
                notify_download_complete = true;
                app.emit("notification", NotificationEvent::ModelDownloadStarted {
                    model_name: "sdxl-turbo-unet",
                    model_type: ModelType::Unet,
                })?;
            }
            
            let unet_file = ModelRegistry::SdxlTurboUnet.get_filename();

            let unet = UNetModel::new(&configs.sd_config, unet_file, &configs.device, configs.dtype)
              .map_err(|err| anyhow!("error initializing unet model: {:?}", err))?;
            
            let unet = Arc::new(unet);

            model_cache.set_unet(unet.clone())?;

            if notify_download_complete {
                app.emit("notification", NotificationEvent::ModelDownloadComplete {
                    model_name: "sdxl-turbo-unet",
                    model_type: ModelType::Unet,
                })?;
            }

            unet
        }
    };

    let init_latent_dist : DiagonalGaussianDistribution = vae.encode(&input_image)?;

    // Parse and calculate the img2img strength
    let img2img_strength = match i2i_strength {
        None => 0.75f64,
        Some(strength) => (strength as f64) / 100.0f64,
    };

    // Create LCM guidance scale embeddings
    let embedding_dim = 256;
    let guidance_scale_embedding = scheduler.get_guidance_scale_embedding(
        guidance_scale, 
        embedding_dim, 
        &configs.device, 
        configs.dtype
    )?;

    // Generate latents from input image using the LCM approach
    println!("Generating latents from input image...");
    let init_latents = (init_latent_dist.sample()? * vae_scale)?;
    println!("Initial latents shape: {:?}", init_latents.shape());

    // Calculate timesteps for LCM with proper img2img handling
    let timesteps = LCMScheduler::get_timesteps_for_steps(configs.scheduler_steps, img2img_strength);
    let t_start = timesteps[0]; // First denoising step

    // Add noise at the appropriate timestep for img2img
    println!("Adding noise to latents for t_start={}", t_start);
    let noise = init_latents.randn_like(0f64, 1f64)?;
    let latents = scheduler.add_noise(&init_latents, noise, t_start)?;

    println!("Latents initialized successfully");
    println!("Initial noise shape: {:?}", latents.shape());

    println!("Starting diffusion process...");
    
    let mut latents = latents;
    let timesteps: Vec<_> = scheduler.timesteps().iter().copied().collect();

    for (timestep_index, &timestep) in timesteps.iter().enumerate() {
        println!("Processing step {}/{} @ timestamp = {}", timestep_index + 1, timesteps.len(), timestep);

        let latent_model_input = if use_guide_scale {
            Tensor::cat(&[&latents, &latents], 0)?
        } else {
            latents.clone()
        };

        let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep);

        // Use the guidance scale embedding in the UNet inference with the proper method name
        let mut noise_pred = match unet.forward_with_guidance(
            &latent_model_input, 
            timestep as f64, 
            &text_embeddings,
            &guidance_scale_embedding) {
            Ok(pred) => pred,
            Err(e) => {
                println!("UNet inference failed with error: {}", e);
                return Err(anyhow::anyhow!("UNet inference failed: {}", e));
            },
        };

        if use_guide_scale {
            let chunks = noise_pred.chunk(2, 0)?;
            let (noise_pred_uncond, noise_pred_text) = (&chunks[0], &chunks[1]);
            noise_pred = (noise_pred_uncond + (guidance_scale * (noise_pred_text - noise_pred_uncond)?)?)?;
        }

        // Apply the LCM scheduler step
        latents = scheduler.step(&noise_pred, timestep, &latents, timestep_index, configs.scheduler_steps)?;
    }

    println!("Diffusion process completed, decoding image...");
    let image = vae.decode(&(latents / vae_scale)?)?;
    
    println!("VAE decode completed");

    println!("Scaling image back");
    let image = ((image / 2.)? + 0.5)?;
    
    println!("Normalized image values");
    let image = (image.clamp(0f32, 1.)? * 255.)?;

    println!("Convert to int8");
    let image = image.to_dtype(DType::U8)?;
    
    println!("Converted to 8-bit format");

    let image = tensor_to_image_buffer(&image.i(0)?)?;

    Ok(image)
}
