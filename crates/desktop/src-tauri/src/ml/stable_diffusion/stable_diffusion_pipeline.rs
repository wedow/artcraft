use std::sync::{Arc, RwLock, RwLockReadGuard, RwLockWriteGuard};

use crate::ml::image::dynamic_image_to_tensor::dynamic_image_to_tensor;
use crate::ml::image::tensor_to_image_buffer::{tensor_to_image_buffer, RgbImage};
use crate::ml::model_cache::ModelCache;
use crate::ml::model_file::StableDiffusionVersion;
use crate::ml::prompt_cache::PromptCache;
use crate::ml::stable_diffusion::get_vae_scale::get_vae_scale;
use crate::ml::stable_diffusion::infer_clip_text_embeddings::infer_clip_text_embeddings;
use crate::state::app_config::AppConfig;
use anyhow::{anyhow, Error as E, Result};
use hf_hub::api::sync::Api;
use candle_core::{DType, IndexOp, Tensor, D};
use candle_transformers::models::stable_diffusion::vae::{AutoEncoderKL, DiagonalGaussianDistribution};
use image::DynamicImage;
use log::info;
use rand::Rng;
use tauri::{AppHandle, Emitter};
use candle_nn::VarBuilder;
use candle_transformers::models::stable_diffusion::lcm::{LCMScheduler, LCMSchedulerConfig};
use candle_transformers::models::stable_diffusion::unet_2d::{BlockConfig, UNet2DConditionModel, UNet2DConditionModelConfig};
use crate::events::notification_event::{ModelType, NotificationEvent};
use crate::ml::models::unet_model::UNetModel;

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
    } = args;
    
    println!("Starting image generation with the following configuration:");
    println!("  Model: {:?}", configs.sd_version);
    println!("  Prompt: {}", prompt);
    println!("  Steps: {}", configs.scheduler_steps);
    println!("  Device: {:?}", configs.device);

    println!("Model dimensions: {}x{}", configs.sd_config.width, configs.sd_config.height);

    // TODO(bt,2025-02-18): The scheduler is `EulerAncestralDiscreteScheduler`, but we may want to port an LCM scheduler.
    //  This is a target for performance improvement
    //  See: https://github.com/huggingface/candle/issues/1331
    //let mut scheduler = configs.sd_config.build_scheduler(
    //    configs.scheduler_steps)?;

    let config = LCMSchedulerConfig::default();
    let mut scheduler = LCMScheduler::new(4, config)?;

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

    // The embedding dimension should match the UNet time embedding dimension
    // For LCM Dreamshaper, this is typically 1280 (not 320)
    // Use a hardcoded value since we don't have direct access to the config
    let embedding_dim = 1280; // Standard for SD models based on UNet config

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
            
            //let repo = configs.sd_version.repo();

            //println!("Building VAE model from : {:?} ... (3)", repo);

            //let vae_file = configs.hf_api.model(repo.to_string())
            //  .get("vae/diffusion_pytorch_model.safetensors")?;


            let use_f16 = true;
            let base_model_repo = "Lykon/dreamshaper-7";
            let api = Api::new()?;
            let vae_file = api.model(base_model_repo.to_string()).get(if use_f16 { "vae/diffusion_pytorch_model.fp16.safetensors" } else { "vae/diffusion_pytorch_model.safetensors" })?;

            println!("Building VAE model from file {:?}...", &vae_file);

            let mut notify_download_complete = false;
            //if !vae_file.exists() {
            if true {
                notify_download_complete = true;
                app.emit("notification", NotificationEvent::ModelDownloadStarted {
                    //model_name: repo,
                    model_name: base_model_repo,
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
                    //model_name: repo,
                    model_name: base_model_repo,
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

            //let repo = configs.sd_version.repo();
            //info!("Downloading UNET model files from: {} ...", repo);

            //let unet_file = configs.hf_api.model(repo.to_string())
            //  .get("unet/diffusion_pytorch_model.safetensors")
            //  .map_err(|err| anyhow!("error fetching model: {:?}", err))?;

            let use_f16 = true;
            let api = Api::new()?;
            let lcm_model_repo = "SimianLuo/LCM_Dreamshaper_v7"; // LCM UNet
            let unet_file = api.model(lcm_model_repo.to_string()).get(if use_f16 {
                if lcm_model_repo == "SimianLuo/LCM_Dreamshaper_v7" {
                    "unet/diffusion_pytorch_model.safetensors"
                } else {
                    "unet/diffusion_pytorch_model.fp16.safetensors"
                }
            } else {
                "unet/diffusion_pytorch_model.safetensors"
            })?;

            let mut notify_download_complete = false;
            //if !unet_file.exists() {
            if true {
                notify_download_complete = true;
                app.emit("notification", NotificationEvent::ModelDownloadStarted {
                    //model_name: repo,
                    model_name: lcm_model_repo,
                    model_type: ModelType::Unet,
                })?;
            }


            info!("Loading unet model ...");
            let vs_unet = unsafe { VarBuilder::from_mmaped_safetensors(&[unet_file], configs.dtype, &configs.device)? };

            let in_channels = 4;
            let use_flash_attn = false;

            let unet_config = UNet2DConditionModelConfig {
                // LCM specific config values
                cross_attention_dim: 768, // Dreamshaper v7 uses 768
                // Rest of configuration...
                center_input_sample: false,
                flip_sin_to_cos: true,
                freq_shift: 0.0,
                blocks: vec![BlockConfig { out_channels: 320, use_cross_attn: Some(1), attention_head_dim: 8 }, BlockConfig { out_channels: 640, use_cross_attn: Some(1), attention_head_dim: 8 }, BlockConfig { out_channels: 1280, use_cross_attn: Some(1), attention_head_dim: 8 }, BlockConfig { out_channels: 1280, use_cross_attn: None, attention_head_dim: 8 }],
                layers_per_block: 2,
                downsample_padding: 1,
                mid_block_scale_factor: 1.0,
                norm_num_groups: 32,
                norm_eps: 1e-5,
                sliced_attention_size: None,
                use_linear_projection: false,
            };
            let unet = UNet2DConditionModel::new(vs_unet, in_channels, 4, use_flash_attn, unet_config)?;

            //let unet = UNetModel::new(&configs.sd_config, unet_file, &configs.device, configs.dtype)
            //  .map_err(|err| anyhow!("error initializing unet model: {:?}", err))?;

            info!("Unet loaded.");

            let unet = Arc::new(unet);

            model_cache.set_unet(unet.clone())?;

            if notify_download_complete {
                app.emit("notification", NotificationEvent::ModelDownloadComplete {
                    //model_name: repo,
                    model_name: lcm_model_repo,
                    model_type: ModelType::Unet,
                })?;
            }

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

        //let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep)?;
        let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep);


        let guidance_emb = if use_guide_scale {
            // For LCM/Dreamshaper, the time embedding dimension is 1280
            let time_embed_dim = 1280; // Standard for SD models (320 base channels * 4)

            println!("Generating guidance scale embedding (scale={})", guidance_scale);
            Some(scheduler.get_guidance_scale_embedding(guidance_scale, time_embed_dim, &configs.device, configs.dtype)?)
        } else {
            None
        };



        info!("Running unet forward pass");
        let mut noise_pred = unet.forward_with_guidance(&latent_model_input, timestep as f64, &text_embeddings, guidance_emb.as_ref())?;

        //let mut noise_pred = match unet.inference(&latent_model_input, timestep as f64, &text_embeddings) {
        //    Ok(pred) => pred,
        //    Err(e) => {
        //        println!("UNet inference failed with error: {}", e);
        //        return Err(anyhow::anyhow!("UNet inference failed: {}", e));
        //    },
        //};

        if use_guide_scale {
            info!("use guide scale");
            let chunks = noise_pred.chunk(2, 0)?;
            let (noise_pred_uncond, noise_pred_text) = (&chunks[0], &chunks[1]);
            info!("calculate noise prediction");
            noise_pred = (noise_pred_uncond + (guidance_scale * (noise_pred_text - noise_pred_uncond)?)?)?;
        }

        info!("scheduler step");
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
