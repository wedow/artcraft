#[cfg(feature = "accelerate")]
extern crate accelerate_src;

#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

use candle_transformers::models::stable_diffusion;
use std::ops::Div;

use anyhow::{Error as E, Result};
use candle_core::{DType, Device, IndexOp, Tensor, D, Module};
use image::{ImageBuffer, Rgb};
use rand::Rng;
use stable_diffusion::vae::AutoEncoderKL;
use tokenizers::Tokenizer;
use log::{info, warn, error};
use anyhow::anyhow;

// Helper function to save image
fn save_image<P: AsRef<std::path::Path>>(img: &Tensor, p: P) -> Result<()> {
    println!("Saving image to {:?}", p.as_ref());
    let p = p.as_ref();
    let (channel, height, width) = img.dims3()?;
    println!("Image dimensions: {}x{} with {} channels", width, height, channel);
    
    if channel != 3 {
        anyhow::bail!("save_image expects an input of shape (3, height, width)")
    }
    let img = img.permute((1, 2, 0))?.flatten_all()?;
    let pixels = img.to_vec1::<u8>()?;
    println!("Converting tensor to image buffer...");
    
    let image: ImageBuffer<Rgb<u8>, Vec<u8>> =
        match ImageBuffer::from_raw(width as u32, height as u32, pixels) {
            Some(image) => image,
            None => anyhow::bail!("error saving image {p:?}"),
        };
    println!("Successfully created image buffer");
    
    image.save(p).map_err(E::from)?;
    println!("Successfully saved image to disk");
    Ok(())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StableDiffusionVersion {
    V1_5,
    V1_5Inpaint,
    V2_1,
    V2Inpaint,
    Xl,
    XlInpaint,
    Turbo,
}

pub struct Args {
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
    pub img2img: Option<String>,
    pub use_f16: bool,
}

impl StableDiffusionVersion {
    fn repo(&self) -> &'static str {
        match self {
            Self::XlInpaint => "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
            Self::Xl => "stabilityai/stable-diffusion-xl-base-1.0",
            Self::V2Inpaint => "stabilityai/stable-diffusion-2-inpainting",
            Self::V2_1 => "stabilityai/stable-diffusion-2-1",
            Self::V1_5 => "runwayml/stable-diffusion-v1-5",
            Self::V1_5Inpaint => "stable-diffusion-v1-5/stable-diffusion-inpainting",
            Self::Turbo => "stabilityai/sdxl-turbo",
        }
    }

    fn unet_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "unet/diffusion_pytorch_model.fp16.safetensors"
                } else {
                    "unet/diffusion_pytorch_model.safetensors"
                }
            }
        }
    }

    fn vae_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "vae/diffusion_pytorch_model.fp16.safetensors"
                } else {
                    "vae/diffusion_pytorch_model.safetensors"
                }
            }
        }
    }

    fn clip_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "text_encoder/model.fp16.safetensors"
                } else {
                    "text_encoder/model.safetensors"
                }
            }
        }
    }

    fn clip2_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "text_encoder_2/model.fp16.safetensors"
                } else {
                    "text_encoder_2/model.safetensors"
                }
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ModelFile {
    Tokenizer,
    Tokenizer2,
    Clip,
    Clip2,
    Unet,
    Vae,
}


impl ModelFile {
    fn get(
        &self,
        filename: Option<String>,
        version: StableDiffusionVersion,
        use_f16: bool,
    ) -> Result<std::path::PathBuf> {
        use hf_hub::api::sync::Api;
        match filename {
            Some(filename) => Ok(std::path::PathBuf::from(filename)),
            None => {
                let (repo, path) = match self {
                    Self::Tokenizer => {
                        let tokenizer_repo = match version {
                            StableDiffusionVersion::V1_5
                            | StableDiffusionVersion::V2_1
                            | StableDiffusionVersion::V1_5Inpaint
                            | StableDiffusionVersion::V2Inpaint => "openai/clip-vit-base-patch32",
                            StableDiffusionVersion::Xl
                            | StableDiffusionVersion::XlInpaint
                            | StableDiffusionVersion::Turbo => {
                                // This seems similar to the patch32 version except some very small
                                // difference in the split regex.
                                "openai/clip-vit-large-patch14"
                            }
                        };
                        (tokenizer_repo, "tokenizer.json")
                    }
                    Self::Tokenizer2 => {
                        ("laion/CLIP-ViT-bigG-14-laion2B-39B-b160k", "tokenizer.json")
                    }
                    Self::Clip => (version.repo(), version.clip_file(use_f16)),
                    Self::Clip2 => (version.repo(), version.clip2_file(use_f16)),
                    Self::Unet => (version.repo(), version.unet_file(use_f16)),
                    Self::Vae => {
                        // Override for SDXL when using f16 weights.
                        // See https://github.com/huggingface/candle/issues/1060
                        if matches!(
                            version,
                            StableDiffusionVersion::Xl | StableDiffusionVersion::Turbo,
                        ) && use_f16
                        {
                            (
                                "madebyollin/sdxl-vae-fp16-fix",
                                "diffusion_pytorch_model.safetensors",
                            )
                        } else {
                            (version.repo(), version.vae_file(use_f16))
                        }
                    }
                };
                let filename = Api::new()?.model(repo.to_string()).get(path)?;
                Ok(filename)
            }
        }
    }
}

fn image_preprocess<T: AsRef<std::path::Path>>(path: T) -> anyhow::Result<Tensor> {
    let img = image::ImageReader::open(path)?.decode()?;
    let (height, width) = (img.height() as usize, img.width() as usize);
    let height = height - height % 32;
    let width = width - width % 32;
    let img = img.resize_to_fill(
        width as u32,
        height as u32,
        image::imageops::FilterType::CatmullRom,
    );
    let img = img.to_rgb8();
    let img = img.into_raw();
    let img = Tensor::from_vec(img, (height, width, 3), &Device::Cpu)?
        .permute((2, 0, 1))?
        .to_dtype(DType::F32)?
        .affine(2. / 255., -1.)?
        .unsqueeze(0)?;
    Ok(img)
}
fn inpainting_tensors(
    sd_version: StableDiffusionVersion,
    mask_path: Option<String>,
    dtype: DType,
    device: &Device,
    use_guide_scale: bool,
    vae: &AutoEncoderKL,
    image: Option<Tensor>,
    vae_scale: f64,
) -> Result<(Option<Tensor>, Option<Tensor>, Option<Tensor>)> {
    match sd_version {
        StableDiffusionVersion::XlInpaint
        | StableDiffusionVersion::V2Inpaint
        | StableDiffusionVersion::V1_5Inpaint => {
            let inpaint_mask = mask_path.ok_or_else(|| {
                anyhow::anyhow!("An inpainting model was requested but mask-path is not provided.")
            })?;
            // Get the mask image with shape [1, 1, 128, 128]
            let mask = mask_preprocess(inpaint_mask)?
                .to_device(device)?
                .to_dtype(dtype)?;
            // Generate the masked image from the image and the mask with shape [1, 3, 1024, 1024]
            let xmask = mask.le(0.5)?.repeat(&[1, 3, 1, 1])?.to_dtype(dtype)?;
            let image = &image
                .ok_or_else(|| anyhow::anyhow!(
                    "An inpainting model was requested but img2img which is used as the input image is not provided."
                ))?;
            let masked_img = (image * xmask)?;
            // Scale down the mask
            let shape = masked_img.shape();
            let (w, h) = (shape.dims()[3] / 8, shape.dims()[2] / 8);
            let mask = mask.interpolate2d(w, h)?;
            // shape: [1, 4, 128, 128]
            let mask_latents = vae.encode(&masked_img)?;
            let mask_latents = (mask_latents.sample()? * vae_scale)?.to_device(device)?;

            let mask_4 = mask.as_ref().repeat(&[1, 4, 1, 1])?;
            let (mask_latents, mask) = if use_guide_scale {
                (
                    Tensor::cat(&[&mask_latents, &mask_latents], 0)?,
                    Tensor::cat(&[&mask, &mask], 0)?,
                )
            } else {
                (mask_latents, mask)
            };
            Ok((Some(mask_latents), Some(mask), Some(mask_4)))
        }
        _ => Ok((None, None, None)),
    }
}

pub fn run(args: Args) -> Result<()> {
    println!("Starting image generation with the following configuration:");
    println!("  Model: {:?}", args.sd_version);
    println!("  Prompt: {}", args.prompt);
    println!("  Steps: {}", args.n_steps.unwrap_or(1));
    println!("  Using CPU: {}", args.cpu);
    
    let device = if args.cpu { 
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
    let dtype = if args.use_f16 { DType::F16 } else { DType::F32 };
    println!("Using {:?} data type", dtype);

    let sd_config = match args.sd_version {
        StableDiffusionVersion::Turbo => {
            println!("Configuring SDXL Turbo");
            stable_diffusion::StableDiffusionConfig::sdxl_turbo(None, args.height, args.width)
        }
        _ => {
            println!("Configuring SD v2.1");
            stable_diffusion::StableDiffusionConfig::v2_1(None, args.height, args.width)
        }
    };
    println!("Model dimensions: {}x{}", sd_config.width, sd_config.height);

    println!("Building scheduler...");
    let mut scheduler = sd_config.build_scheduler(args.n_steps.unwrap_or(1))?;
    let seed = args.seed.unwrap_or_else(|| rand::thread_rng().gen());
    println!("Using seed: {}", seed);
    device.set_seed(seed)?;

    println!("Initializing Hugging Face API...");
    let api = hf_hub::api::sync::Api::new()?;
    let repo = args.sd_version.repo();
    let use_f16 = args.use_f16;
    println!("Downloading model files from: {}", repo);
    
    println!("Downloading VAE and UNet...");
    let vae_file = api.model(repo.to_string()).get("vae/diffusion_pytorch_model.safetensors")?;
    let unet_file = api.model(repo.to_string()).get("unet/diffusion_pytorch_model.safetensors")?;
    
    println!("Downloading text encoders...");
    let clip_file = api.model(repo.to_string()).get("text_encoder/model.safetensors")?;
    let clip2_file = api.model(repo.to_string()).get("text_encoder_2/model.safetensors")?;
    let tokenizer = api.model("openai/clip-vit-large-patch14".to_string()).get("tokenizer.json")?;
    let tokenizer2 = api.model("laion/CLIP-ViT-bigG-14-laion2B-39B-b160k".to_string()).get("tokenizer.json")?;

    println!("Building models...");
    let vae = sd_config.build_vae(vae_file, &device, dtype)?;
    let unet = sd_config.build_unet(unet_file, &device, 4, false, dtype)?;
    let (image, init_latent_dist) = match &args.img2img {
        None => (None, None),
        Some(image) => {
            match image_preprocess(image) {
                Ok(img) => {
                    let img = img.to_device(&device)?.to_dtype(dtype)?;
                    (Some(img.clone()), Some(vae.encode(&img)?))
                },
                Err(e) => {
                    error!("Failed to preprocess image: {}", e);
                    return Err(anyhow!("Failed to preprocess image: {}", e));
                }
            }
        }
    };
    // Build text encoders
    println!("Building text encoders...");
    let text_model = stable_diffusion::build_clip_transformer(&sd_config.clip, clip_file, &device, dtype)?;
    let text_model2 = stable_diffusion::build_clip_transformer(sd_config.clip2.as_ref().unwrap(), clip2_file, &device, dtype)?;
    
    // Tokenize and encode text
    println!("Processing text prompt...");
    let tokenizer = tokenizers::Tokenizer::from_file(tokenizer).map_err(E::msg)?;
    let tokenizer2 = tokenizers::Tokenizer::from_file(tokenizer2).map_err(E::msg)?;
    
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
            text_embeddings(
                &args.prompt,
                &args.uncond_prompt,
                None, // tokenizer
                None, // clip_weights
                None, // clip2_weights
                args.sd_version,
                &sd_config,
                use_f16, // use_f16
                &device,
                dtype,
                false, // use_guide_scale
                *first,
            )
        })
        .collect::<Result<Vec<_>>>()?;

    let text_embeddings = Tensor::cat(&text_embeddings, D::Minus1)?;
    println!("Text embeddings shape: {:?}", text_embeddings.shape());

    println!("Generating initial noise...");
    // let timesteps = scheduler.timesteps().to_vec();
    // let latents = Tensor::randn(
    //     0f32,
    //     1f32,
    //     (1, 4, sd_config.height / 8, sd_config.width / 8),
    //     &device,
    // )?;
    // let latents = (latents * scheduler.init_noise_sigma())?;
    // println!("Initial noise shape: {:?}", latents.shape());
    let (mask_latents, mask, mask_4) = inpainting_tensors(
        args.sd_version,
        None,
        dtype,
        &device,
        false,
        &vae,
        image,
        0.13025,
    )?;
    println!("Starting diffusion process...");
    // let mut latents = latents;
    let n_steps = args.n_steps.unwrap_or(1);
    let img2img_strength = 0.8;
    let t_start = if args.img2img.is_some() {
        n_steps - (n_steps as f64 * img2img_strength) as usize
    } else {
        0
    };
    let timesteps = scheduler.timesteps().to_vec();
    let bsize = 1;
    let vae_scale = 0.13025;
    let latents = match &init_latent_dist {
        Some(init_latent_dist) => {
            let fallback_latents = Tensor::randn(
                0f32,
                1f32,
                (bsize, 4, sd_config.height / 8, sd_config.width / 8),
                &device,
            )?;
            let init_latent_dist_sample = init_latent_dist.sample().unwrap_or(fallback_latents.clone());
            
            let latents = (init_latent_dist_sample * vae_scale).unwrap_or(fallback_latents).to_device(&device)?;
            if t_start < timesteps.len() {
                let noise = latents.randn_like(0f64, 1f64)?;
                scheduler.add_noise(&latents, noise, timesteps[t_start])?
            } else {
                latents
            }
        }
        None => {
            let latents = Tensor::randn(
                0f32,
                1f32,
                (bsize, 4, sd_config.height / 8, sd_config.width / 8),
                &device,
            )?;
            // scale the initial noise by the standard deviation required by the scheduler
            (latents * scheduler.init_noise_sigma())?
        }
    };
    let mut latents = latents.to_dtype(dtype)?;
    let use_guide_scale = false;

    for (timestep_index, &timestep) in timesteps.iter().enumerate() {
        if timestep_index < t_start {
            continue;
        }
        println!("Processing step {}/{}", timestep_index + 1, timesteps.len());
        let latent_model_input = latents.clone();
        println!("Latent input shape: {:?}", latent_model_input.shape());
        let latent_model_input = if use_guide_scale {
            Tensor::cat(&[&latents, &latents], 0)?
        } else {
            latents.clone()
        };

        let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep)?;

        let latent_model_input = match args.sd_version {
            StableDiffusionVersion::XlInpaint
            | StableDiffusionVersion::V2Inpaint
            | StableDiffusionVersion::V1_5Inpaint => Tensor::cat(
                &[
                    &latent_model_input,
                    mask.as_ref().unwrap(),
                    mask_latents.as_ref().unwrap(),
                ],
                1,
            )?,
            _ => latent_model_input,
        }
        .to_device(&device)?;

        let noise_pred =
            unet.forward(&latent_model_input, timestep as f64, &text_embeddings)?;

        // let noise_pred = if use_guide_scale {
        //     let noise_pred = noise_pred.chunk(2, 0)?;
        //     let (noise_pred_uncond, noise_pred_text) = (&noise_pred[0], &noise_pred[1]);

        //     (noise_pred_uncond + ((noise_pred_text - noise_pred_uncond)? * guidance_scale)?)?
        // } else {
        //     noise_pred
        // };        
        // println!("Scaling model input...");
        // let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep)?;
        // println!("Scaled input shape: {:?}", latent_model_input.shape());
        
        println!("Running UNet inference with timestep {}...", timestep);
        // let noise_pred = match unet.forward(&latent_model_input, timestep as f64, &text_embeddings) {
        //     Ok(pred) => {
        //         println!("UNet inference successful");
        //         pred
        //     }
        //     Err(e) => {
        //         println!("UNet inference failed with error: {}", e);
        //         return Err(anyhow::anyhow!("UNet inference failed: {}", e));
        //     }
        // };
        println!("Noise prediction shape: {:?}", noise_pred.shape());
        
        println!("Applying scheduler step...");
        latents = scheduler.step(&noise_pred, timestep, &latents)?;
        println!("Step {}/{} completed", timestep_index + 1, timesteps.len());
    }

    println!("Diffusion process completed, decoding image...");
    let image = match vae.decode(&(latents / 0.13025)?) {
        Ok(img) => img,
        Err(e) => {
            error!("Failed to decode image from latents: {}", e);
            return Err(anyhow!("Failed to decode image from latents: {}", e));
        }
    };
    println!("VAE decode completed");
    let image = ((image / 2.)? + 0.5)?.to_device(&Device::Cpu)?;
    println!("Normalized image values");
    let image = (image.clamp(0f32, 1.)? * 255.)?.to_dtype(DType::U8)?;
    println!("Converted to 8-bit format");
    
    match save_image(&image.i(0)?, "temp.png") {
        Ok(_) => println!("Image generation completed successfully"),
        Err(e) => {
            error!("Failed to save generated image: {}", e);
            return Err(anyhow!("Failed to save generated image: {}", e));
        }
    }

    Ok(())
}
fn mask_preprocess<T: AsRef<std::path::Path>>(path: T) -> anyhow::Result<Tensor> {
    let img = image::open(path)?.to_luma8();
    let (new_width, new_height) = {
        let (width, height) = img.dimensions();
        (width - width % 32, height - height % 32)
    };
    let img = image::imageops::resize(
        &img,
        new_width,
        new_height,
        image::imageops::FilterType::CatmullRom,
    )
    .into_raw();
    let mask = Tensor::from_vec(img, (new_height as usize, new_width as usize), &Device::Cpu)?
        .unsqueeze(0)?
        .to_dtype(DType::F32)?
        .div(255.0)?
        .unsqueeze(0)?;
    Ok(mask)
}
#[allow(clippy::too_many_arguments)]
fn text_embeddings(
    prompt: &str,
    uncond_prompt: &str,
    tokenizer: Option<String>,
    clip_weights: Option<String>,
    clip2_weights: Option<String>,
    sd_version: StableDiffusionVersion,
    sd_config: &stable_diffusion::StableDiffusionConfig,
    use_f16: bool,
    device: &Device,
    dtype: DType,
    use_guide_scale: bool,
    first: bool,
) -> Result<Tensor> {
    let tokenizer_file = if first {
        ModelFile::Tokenizer
    } else {
        ModelFile::Tokenizer2
    };
    let tokenizer = tokenizer_file.get(tokenizer, sd_version, use_f16)?;
    let tokenizer = Tokenizer::from_file(tokenizer).map_err(E::msg)?;
    let pad_id = match &sd_config.clip.pad_with {
        Some(padding) => *tokenizer.get_vocab(true).get(padding.as_str()).unwrap(),
        None => *tokenizer.get_vocab(true).get("<|endoftext|>").unwrap(),
    };
    
    println!("Running with prompt \"{prompt}\".");
    let mut tokens = tokenizer
        .encode(prompt, true)
        .map_err(E::msg)?
        .get_ids()
        .to_vec();
    if tokens.len() > sd_config.clip.max_position_embeddings {
        anyhow::bail!(
            "the prompt is too long, {} > max-tokens ({})",
            tokens.len(),
            sd_config.clip.max_position_embeddings
        )
    }
    while tokens.len() < sd_config.clip.max_position_embeddings {
        tokens.push(pad_id)
    }
    let tokens = Tensor::new(tokens.as_slice(), device)?.unsqueeze(0)?;

    println!("Building the Clip transformer.");
    let clip_weights_file = if first {
        ModelFile::Clip
    } else {
        ModelFile::Clip2
    };
    let clip_weights = if first {
        clip_weights_file.get(clip_weights, sd_version, use_f16)?
    } else {
        clip_weights_file.get(clip2_weights, sd_version, use_f16)?
    };
    let clip_config = if first {
        &sd_config.clip
    } else {
        sd_config.clip2.as_ref().unwrap()
    };
    let text_model = stable_diffusion::build_clip_transformer(clip_config, clip_weights, device, DType::F32)?;
    
    let text_embeddings = text_model.forward(&tokens)?;

    let text_embeddings = if use_guide_scale {
        let mut uncond_tokens = tokenizer
            .encode(uncond_prompt, true)
            .map_err(E::msg)?
            .get_ids()
            .to_vec();
        if uncond_tokens.len() > sd_config.clip.max_position_embeddings {
            anyhow::bail!(
                "the negative prompt is too long, {} > max-tokens ({})",
                uncond_tokens.len(),
                sd_config.clip.max_position_embeddings
            )
        }
        while uncond_tokens.len() < sd_config.clip.max_position_embeddings {
            uncond_tokens.push(pad_id)
        }

        let uncond_tokens = Tensor::new(uncond_tokens.as_slice(), device)?.unsqueeze(0)?;
        let uncond_embeddings = text_model.forward(&uncond_tokens)?;

        Tensor::cat(&[uncond_embeddings, text_embeddings], 0)?.to_dtype(dtype)?
    } else {
        text_embeddings.to_dtype(dtype)?
    };
    Ok(text_embeddings)
}

// fn main() -> Result<()> {
//     let args = Args::parse();
//     run(args)
// }
