use std::sync::{Arc, RwLock, RwLockReadGuard, RwLockWriteGuard};

use crate::events::notification_event::{NotificationEvent, NotificationModelType};
use crate::ml::image::dynamic_image_to_tensor::dynamic_image_to_tensor;
use crate::ml::image::tensor_to_image_buffer::{tensor_to_image_buffer, RgbImage};
use crate::ml::model_cache::ModelCache;
use crate::ml::model_file::StableDiffusionVersion;
use crate::ml::models::unet_model::UNetModel;
use crate::ml::prompt_cache::PromptCache;
use crate::ml::stable_diffusion::get_vae_scale::get_vae_scale;
use crate::ml::stable_diffusion::infer_clip_text_embeddings::infer_clip_text_embeddings;
use crate::ml::weights_registry::weights::{SDXL_TURBO_UNET, SDXL_TURBO_VAE};
use crate::state::app_config::AppConfig;
use crate::state::app_dir::AppDataRoot;
use anyhow::{anyhow, Error as E, Result};
use candle_core::{DType, IndexOp, Tensor, D};
use candle_transformers::models::stable_diffusion::vae::{AutoEncoderKL, DiagonalGaussianDistribution};
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
    pub app_data_root: &'a AppDataRoot,
    pub app: &'a AppHandle,
}

pub fn stable_diffusion_pipeline(args: Args<'_>) -> Result<RgbImage> {
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
        app_data_root,
    } = args;
    
    let weights_dir = app_data_root.weights_dir();
    
    println!("Starting image generation with the following configuration:");
    println!("  Model: {:?}", configs.sd_version);
    println!("  Prompt: {}", prompt);
    println!("  Steps: {}", configs.scheduler_steps);
    println!("  Device: {:?}", configs.device);

    println!("Model dimensions: {}x{}", configs.sd_config.width, configs.sd_config.height);

    // TODO(bt,2025-02-18): The scheduler is `EulerAncestralDiscreteScheduler`, but we may want to port an LCM scheduler.
    //  This is a target for performance improvement
    //  See: https://github.com/huggingface/candle/issues/1331
    let mut scheduler = configs.sd_config.build_scheduler(
        configs.scheduler_steps)?;

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
            weights_dir,
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
            
            let vae_file = weights_dir.weight_path(&SDXL_TURBO_VAE);
            
            let vae = configs
              .sd_config
              .build_vae(vae_file, &configs.device, configs.dtype)?;

            let vae = Arc::new(vae);
            
            model_cache.set_vae(vae.clone())?;

            vae
        }
    };

    let maybe_unet = model_cache.get_unet()?;

    let unet = match maybe_unet {
        Some(unet) => unet,
        None => {
            info!("No unet found in cache; loading...");

            let unet_file = weights_dir.weight_path(&SDXL_TURBO_UNET);

            let unet = UNetModel::new(&configs.sd_config, unet_file, &configs.device, configs.dtype)
              .map_err(|err| anyhow!("error initializing unet model: {:?}", err))?;
            
            let unet = Arc::new(unet);

            model_cache.set_unet(unet.clone())?;

            unet
        }
    };

    let init_latent_dist : DiagonalGaussianDistribution = vae.encode(&input_image)?;

    // TODO(bt,2025-02-18): This takes a little bit to generate the sample.
    //  This is a target for performance improvement
    println!("Generating latents from input image...");
    let latents = (init_latent_dist.sample()? * vae_scale)?;
    
    //.to_device(&configs.device)?;
    
    println!("Initial latents shape: {:?}", latents.shape());

    println!("Calculating start step for diffusion process...");

    let img2img_strength = match i2i_strength {
        None => 0.75f64,
        Some(strength) => (strength as f64) / 100.0f64,
    };

    let t_start = {
        let start = configs.scheduler_steps - (configs.scheduler_steps as f64 * img2img_strength) as usize;

        println!("Starting from step {} of {} (strength: {})", start, configs.scheduler_steps, img2img_strength);
        start
    };

    let latents = if t_start < scheduler.timesteps().len() {
        println!("Adding noise to latents...");
        let noise = latents.randn_like(0f64, 1f64)?;
        scheduler.add_noise(&latents, noise, scheduler.timesteps()[t_start])?
    } else {
        println!("Using latents directly (no noise addition needed)");
        latents
    };

    println!("Latents initialized successfully");

    let timesteps: Vec<_> = scheduler.timesteps().iter().copied().collect();

    // Initial noise shape: [1, 4, 64, 64]
    println!("Initial noise shape: {:?}", latents.shape());

    println!("Starting diffusion process...");
    
    let mut latents = latents;

    for (timestep_index, &timestep) in timesteps.iter().enumerate() {
        if timestep_index < t_start {
            continue;
        }

        println!("Processing step {}/{} @ timestamp = {}", timestep_index + 1, timesteps.len(), timestep);

        let latent_model_input = if use_guide_scale {
            Tensor::cat(&[&latents, &latents], 0)?
        } else {
            latents.clone() // TODO(bt,2025-08-18): Do we have to clone the tensor? `scale_model_input` requires ownership
        };

        let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep)?;

        let mut noise_pred = match unet.inference(&latent_model_input, timestep as f64, &text_embeddings) {
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

        latents = scheduler.step(&noise_pred, timestep, &latents)?;
    }

    println!("Diffusion process completed, decoding image...");
    let image = vae.decode(&(latents / vae_scale)?)?;
    
    println!("VAE decode completed");

    println!("Scaling image back");
    let image = ((image / 2.)? + 0.5)?;
    
    // TODO(bt,2025-08-18): This normalization is slow.
    //  This is a target for performance improvement
    println!("Normalized image values");
    let image = (image.clamp(0f32, 1.)? * 255.)?;

    println!("Convert to int8");
    let image = image.to_dtype(DType::U8)?;
    
    println!("Converted to 8-bit format");

    let image = tensor_to_image_buffer(&image.i(0)?)?;

    Ok(image)
}
