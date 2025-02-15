#[cfg(feature = "accelerate")]
extern crate accelerate_src;
#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

use std::mem::forget;
use std::path::Path;
use std::sync::{Arc, LockResult, RwLock, RwLockReadGuard, RwLockWriteGuard};
use candle_transformers::models::stable_diffusion;

use crate::ml::infer_clip_text_embeddings::infer_clip_text_embeddings;
use crate::ml::model_file::StableDiffusionVersion;
use crate::ml::save_image_from_tensor::save_image_from_tensor;
use anyhow::{Error as E, Result};
use candle_core::{DType, Device, IndexOp, Module, Tensor, D};
use candle_transformers::models::stable_diffusion::vae::DiagonalGaussianDistribution;
use hf_hub::api::sync::Api;
use log::info;
use once_cell::sync::Lazy;
use rand::Rng;
use crate::ml::create_inpainting_tensors::create_inpainting_tensors;
use crate::ml::load_image_file_to_tensor::load_image_file_to_tensor;
use crate::ml::model_cache::ModelCache;
use crate::ml::models::unet_model::UNetModel;
use crate::model_config::ModelConfig;
// TODO: Clean up

// Note for Kasisnu: I'm going to start using lifetimes as long as that doesn't slow your velocity
// Basically the args o this telescopic args struct are guaranteed to live as long as the struct
// itself with the 'a lifetime.
pub struct Args<'a> {
    pub image_path: &'a Path,
    pub api: Api,
    pub prompt: String,
    pub uncond_prompt: String,
    pub cpu: bool,
    pub height: Option<usize>,
    pub width: Option<usize>,
    pub n_steps: Option<usize>,
    pub num_samples: usize,
    pub seed: Option<u64>,
    pub sd_version: StableDiffusionVersion,
    pub guidance_scale: Option<f64>,
    pub model_cache: &'a ModelCache,
    pub model_configs: &'a ModelConfig,
}

pub fn run(args: Args<'_>) -> Result<()> {
    println!("Starting image generation with the following configuration:");
    println!("  Model: {:?}", args.sd_version);
    println!("  Prompt: {}", args.prompt);
    println!("  Steps: {}", args.n_steps.unwrap_or(1));
    println!("  Using CPU: {}", args.cpu);


    println!("Model dimensions: {}x{}", args.model_configs.sd_config.width, args.model_configs.sd_config.height);

    println!("Building scheduler...");
    let mut scheduler = args.model_configs.sd_config.build_scheduler(args.n_steps.unwrap_or(1))?;

    let seed = args.seed.unwrap_or_else(|| rand::thread_rng().gen());
    println!("Using seed: {}", seed);

    args.model_configs.device.set_seed(seed)?;

    println!("Initializing Hugging Face API...");

    let repo = args.sd_version.repo();
    println!("Downloading model files from: {}", repo);
    
    //println!("Downloading VAE ...");
    //let vae_file = args.api.model(repo.to_string()).get("vae/diffusion_pytorch_model.safetensors")?;

    //println!("VAE Path: {:?}", &vae_file);

    //println!("Downloading text encoders...");
    //let clip_file = args.api.model(repo.to_string()).get("text_encoder/model.safetensors")?;
    //let clip2_file = args.api.model(repo.to_string()).get("text_encoder_2/model.safetensors")?;
    //let tokenizer = args.api.model("openai/clip-vit-large-patch14".to_string()).get("tokenizer.json")?;
    //let tokenizer2 = args.api.model("laion/CLIP-ViT-bigG-14-laion2B-39B-b160k".to_string()).get("tokenizer.json")?;

    //println!("Building VAE model...");
    //let vae = sd_config.build_vae(vae_file, &device, dtype)?;

    //// Build text encoders
    //println!("Building text encoders...");
    //let text_model = stable_diffusion::build_clip_transformer(&sd_config.clip, clip_file, &device, dtype)?;
    //let text_model2 = stable_diffusion::build_clip_transformer(sd_config.clip2.as_ref().unwrap(), clip2_file, &device, dtype)?;
    //
    //// Tokenize and encode text
    //println!("Processing text prompt...");
    //let tokenizer = tokenizers::Tokenizer::from_file(tokenizer).map_err(E::msg)?;
    //let tokenizer2 = tokenizers::Tokenizer::from_file(tokenizer2).map_err(E::msg)?;
    
    println!("Preparing text embeddings...");
    let which = match args.sd_version {
        StableDiffusionVersion::Xl
        | StableDiffusionVersion::XlInpaint
        | StableDiffusionVersion::Turbo => vec![true, false],
        _ => vec![true],
    };
    
    let text_embeddings = which
        .iter()
        .map(|first| {
            infer_clip_text_embeddings(
                &args.prompt,
                &args.uncond_prompt,
                None, // tokenizer
                None, // clip_weights
                None, // clip2_weights
                args.sd_version,
                &args.model_configs.sd_config,
                false, // use_f16
                &args.model_configs.device,
                args.model_configs.dtype,
                false, // use_guide_scale
                *first,
            )
        })
        .collect::<Result<Vec<_>>>()?;

    let text_embeddings = Tensor::cat(&text_embeddings, D::Minus1)?;
    println!("Text embeddings shape: {:?}", text_embeddings.shape());

    println!("Loading input image into tensor...");

    let input_image = load_image_file_to_tensor(args.image_path, &args.model_configs.device)?;

    // REFERENCE IMAGE shape: [1, 3, 1024, 1024]
    println!("REFERENCE IMAGE shape: {:?}", input_image.shape());

    let use_guide_scale = false; // TODO

    let vae_scale = match args.model_configs.sd_version {
        StableDiffusionVersion::V1_5
        | StableDiffusionVersion::V1_5Inpaint
        | StableDiffusionVersion::V2_1
        | StableDiffusionVersion::V2Inpaint
        | StableDiffusionVersion::XlInpaint
        | StableDiffusionVersion::Xl => 0.18215,
        StableDiffusionVersion::Turbo => 0.13025,
    };



    let encoded_image : DiagonalGaussianDistribution = args.model_cache.vae_encode(&input_image)?;

    let encoded_sample = encoded_image.sample()?;

    // Encoded sample shape: [1, 4, 128, 128] ... so close. Just needs to be smaller.
    println!("Encoded sample shape: {:?}", encoded_sample.shape());

    let mask_latents = (encoded_sample * vae_scale)?.to_device(&args.model_configs.device)?;

    println!("Mask latents shape: {:?}", mask_latents.shape());


    // TODO: Just to trip the conditionals that force mask/inpaint generation
    // TODO: Set this to turbo to turn off inpaint, anything else will turn it on.
    // TODO: THIS MIGHT NOT BE POSSIBLE WITH TURBO: https://huggingface.co/stabilityai/sdxl-turbo/discussions/7
    // TODO/SEE ALSO: https://www.reddit.com/r/StableDiffusion/comments/198cl08/major_inpainting_issues_with_sdxl_xl_turbo/
    // TODO/SEE ALSO: Alternate weights/issue: https://github.com/huggingface/diffusers/issues/6529
    // TODO/SEE ALSO: https://huggingface.co/spaces/OzzyGT/diffusers-fast-inpaint (THIS LOOKS AWFUL THOUGH -- let's not use this)
    //
    // TODO: Referencing this code: https://github.com/placrosse/candle/blob/43017539ab4f9ccb43015b456136b704ebf693e0/candle-examples/examples/stable-diffusion/main.rs#L491
    const HACK_INPAINT_SD_VERSION : StableDiffusionVersion = StableDiffusionVersion::Turbo;

    // TODO: This is inpainting. It doesn't work yet.
    //let (mask_latents, mask, mask_4) = create_inpainting_tensors(
    //    HACK_INPAINT_SD_VERSION, // TODO: This is a hack
    //    Some(args.image_path.to_path_buf()), // TODO: Mask needs hardcoding
    //    args.model_configs.dtype,
    //    &args.model_configs.device,
    //    use_guide_scale,
    //    &args.model_cache,
    //    Some(input_image),
    //    vae_scale,
    //)?;

    println!("Generating initial noise...");
    let timesteps = scheduler.timesteps().to_vec();

    // TODO: This shape may need to change for inpainting.
    let latents = Tensor::randn(
        0f32,
        1f32,
        (1, 4, args.model_configs.sd_config.height / 8, args.model_configs.sd_config.width / 8),
        &args.model_configs.device,
    )?;

    //let mut latents = (latents * scheduler.init_noise_sigma())?;
    let mut latents = (mask_latents * scheduler.init_noise_sigma())?;

    // Initial noise shape: [1, 4, 64, 64]
    println!("Initial noise shape: {:?}", latents.shape());

    println!("Starting diffusion process...");

    for (timestep_index, &timestep) in timesteps.iter().enumerate() {
        println!("Processing step {}/{}", timestep_index + 1, timesteps.len());

        let latent_model_input = latents.clone();

        // Latent input shape: [1, 4, 64, 64]
        println!("Latent input shape: {:?}", latent_model_input.shape());
        
        println!("Scaling model input...");
        let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep)?;

        // Scaled input shape: [1, 4, 64, 64]
        println!("Scaled input shape: {:?}", latent_model_input.shape());


        // TODO: THIS IS A HACK
        //let latent_model_input = match HACK_INPAINT_SD_VERSION {
        //    StableDiffusionVersion::XlInpaint
        //    | StableDiffusionVersion::V2Inpaint
        //    | StableDiffusionVersion::V1_5Inpaint => {
        //        info!("Concatenating input shape: {:?}", latent_model_input.shape());
        //        info!("Mask shape: {:?}", mask.as_ref().unwrap().shape());
        //        info!("Mask latents shape: {:?}", mask_latents.as_ref().unwrap().shape());
        //        info!("IF THIS FAILS, REVERT THE `HACK_INPAINT_SD_VERSION` 'flag'");
        //        Tensor::cat(
        //            &[
        //                &latent_model_input,
        //                mask.as_ref().unwrap(),
        //                mask_latents.as_ref().unwrap(),
        //            ],
        //            1,
        //        )?
        //    },
        //    _ => latent_model_input,
        //}
        //  .to_device(&args.model_configs.device)?;


        
        println!("Running UNet inference with timestep {}...", timestep);

        let noise_pred = args.model_cache.unet_inference(&latent_model_input, timestep as f64, &text_embeddings)?;

        println!("Noise prediction shape: {:?}", noise_pred.shape());
        
        println!("Applying scheduler step...");
        latents = scheduler.step(&noise_pred, timestep, &latents)?;

        println!("Step {}/{} completed", timestep_index + 1, timesteps.len());
    }

    println!("Diffusion process completed, decoding image...");
    let image = args.model_cache.vae_decode(&(latents / 0.13025)?)?;

    println!("VAE decode completed");
    let image = ((image / 2.)? + 0.5)?.to_device(&Device::Cpu)?;

    println!("Normalized image values");
    let image = (image.clamp(0f32, 1.)? * 255.)?.to_dtype(DType::U8)?;

    println!("Converted to 8-bit format");
    
    save_image_from_tensor(&image.i(0)?, "temp.png")?;
    println!("Image generation completed successfully");

    Ok(())
}
