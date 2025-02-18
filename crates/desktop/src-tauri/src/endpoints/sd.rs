use std::sync::{RwLock, RwLockReadGuard, RwLockWriteGuard};

use crate::ml::image::dynamic_image_to_tensor::dynamic_image_to_tensor;
use crate::ml::image::tensor_to_image_buffer::{tensor_to_image_buffer, RgbImage};
use crate::ml::infer_clip_text_embeddings::infer_clip_text_embeddings;
use crate::ml::model_cache::ModelCache;
use crate::ml::prompt_cache::PromptCache;
use crate::ml::stable_diffusion::get_vae_scale::get_vae_scale;
use crate::state::app_config::AppConfig;
use anyhow::{Error as E, Result};
use candle_core::{DType, IndexOp, D};
use candle_transformers::models::stable_diffusion::vae::DiagonalGaussianDistribution;
use image::DynamicImage;
use log::info;
use rand::Rng;

// TODO: Clean up

// Note for Kasisnu: I'm going to start using lifetimes as long as that doesn't slow your velocity
// Basically the args o this telescopic args struct are guaranteed to live as long as the struct
// itself with the 'a lifetime.
pub struct Args<'a> {
    pub image: &'a DynamicImage,
    pub prompt: String,
    pub uncond_prompt: String,
    pub guidance_scale: Option<f64>,
    pub configs: &'a AppConfig,
    pub model_cache: &'a ModelCache,
    pub prompt_cache: &'a PromptCache,
}

pub fn run(args: Args<'_>) -> Result<RgbImage> {
    println!("Starting image generation with the following configuration:");
    println!("  Model: {:?}", args.configs.sd_version);
    println!("  Prompt: {}", args.prompt);
    println!("  Steps: {}", args.configs.scheduler_steps);
    println!("  Device: {:?}", args.configs.device);


    println!("Model dimensions: {}x{}", args.configs.sd_config.width, args.configs.sd_config.height);

    println!("Building scheduler...");
    let mut scheduler = args.configs.sd_config.build_scheduler(
        args.configs.scheduler_steps)?;

    let seed = args.configs.seed.unwrap_or_else(|| rand::thread_rng().gen());

    println!("Using seed: {}", seed);
    args.configs.device.set_seed(seed)?;

    info!("Checking if prompt is cached");
    let maybe_cached = args.prompt_cache.get_copy(&args.prompt)?;
    
    let text_embeddings = if let Some(tensor) = maybe_cached {
        info!("Prompt is cached!");
        tensor
    } else {
        info!("Prompt is NOT cached! Calculating embedding...");
        let tensor = infer_clip_text_embeddings(
            &args.prompt,
            &args.uncond_prompt,
            None, // tokenizer
            None, // clip_weights
            None, // clip2_weights
            args.configs.sd_version,
            &args.configs.sd_config,
            false, // use_f16
            &args.configs.device,
            args.configs.dtype,
            false, // use_guide_scale
        )?;
        args.prompt_cache.store_copy(&args.prompt, &tensor)?;
        tensor
    };
    
    println!("Text embeddings shape: {:?}", text_embeddings.shape());

    println!("Loading input image into tensor...");

    let input_image = dynamic_image_to_tensor(
        args.image,
        &args.configs.device,
        args.configs.dtype)?;

    println!("Reference image shape: {:?}", input_image.shape());

    let vae_scale = get_vae_scale(args.configs.sd_version);

    let init_latent_dist : DiagonalGaussianDistribution = args.model_cache.vae_encode(&input_image)?;

    // TODO(bt,2025-02-18): This takes a little bit to generate.
    println!("Generating latents from input image...");
    let latents = (init_latent_dist.sample()? * vae_scale)?;
    
    //.to_device(&args.configs.device)?;
    
    println!("Initial latents shape: {:?}", latents.shape());

    println!("Calculating start step for diffusion process...");
    let img2img_strength = 0.75f64;

    let t_start = {
        let start = args.configs.scheduler_steps - (args.configs.scheduler_steps as f64 * img2img_strength) as usize;

        println!("Starting from step {} of {} (strength: {})", start, args.configs.scheduler_steps, img2img_strength);
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
        
        // TODO(bt,2025-08-18): Do we have to clone the tensor?
        let latent_model_input = scheduler.scale_model_input(latents.clone(), timestep)?;
        
        let noise_pred = match args.model_cache.unet_inference(&latent_model_input, timestep as f64, &text_embeddings) {
            Ok(pred) => {
                pred
            },
            Err(e) => {
                println!("UNet inference failed with error: {}", e);
                return Err(anyhow::anyhow!("UNet inference failed: {}", e));
            },
        };

        latents = scheduler.step(&noise_pred, timestep, &latents)?;
    }

    println!("Diffusion process completed, decoding image...");
    let image = args.model_cache.vae_decode(&(latents / vae_scale)?)?;
    
    println!("VAE decode completed");

    println!("Scaling image back");
    let image = ((image / 2.)? + 0.5)?;
    
    // TODO(bt,2025-08-18): This normalization is slow.
    println!("Normalized image values");
    let image = (image.clamp(0f32, 1.)? * 255.)?;

    println!("Convert to int8");
    let image = image.to_dtype(DType::U8)?;
    
    println!("Converted to 8-bit format");

    let image = tensor_to_image_buffer(&image.i(0)?)?;

    Ok(image)
}
