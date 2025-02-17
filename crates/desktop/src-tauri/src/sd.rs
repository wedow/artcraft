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

  let image: ImageBuffer<Rgb<u8>, Vec<u8>> = match ImageBuffer::from_raw(width as u32, height as u32, pixels) {
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
  pub img2img_strength: f64,
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
  fn get(&self, filename: Option<String>, version: StableDiffusionVersion, use_f16: bool) -> Result<std::path::PathBuf> {
    use hf_hub::api::sync::Api;
    match filename {
      Some(filename) => Ok(std::path::PathBuf::from(filename)),
      None => {
        let (repo, path) = match self {
          Self::Tokenizer => {
            let tokenizer_repo = match version {
              StableDiffusionVersion::V1_5 | StableDiffusionVersion::V2_1 | StableDiffusionVersion::V1_5Inpaint | StableDiffusionVersion::V2Inpaint => "openai/clip-vit-base-patch32",
              StableDiffusionVersion::Xl | StableDiffusionVersion::XlInpaint | StableDiffusionVersion::Turbo => "openai/clip-vit-large-patch14",
            };
            (tokenizer_repo, "tokenizer.json")
          },
          Self::Tokenizer2 => ("laion/CLIP-ViT-bigG-14-laion2B-39B-b160k", "tokenizer.json"),
          Self::Clip => (version.repo(), if use_f16 { "text_encoder/model.fp16.safetensors" } else { "text_encoder/model.safetensors" }),
          Self::Clip2 => (version.repo(), if use_f16 { "text_encoder_2/model.fp16.safetensors" } else { "text_encoder_2/model.safetensors" }),
          Self::Unet => (version.repo(), if use_f16 { "unet/diffusion_pytorch_model.fp16.safetensors" } else { "unet/diffusion_pytorch_model.safetensors" }),
          Self::Vae => {
            if matches!(version, StableDiffusionVersion::Xl | StableDiffusionVersion::Turbo) && use_f16 {
              ("madebyollin/sdxl-vae-fp16-fix", "diffusion_pytorch_model.safetensors")
            } else {
              (version.repo(), if use_f16 { "vae/diffusion_pytorch_model.fp16.safetensors" } else { "vae/diffusion_pytorch_model.safetensors" })
            }
          },
        };
        let filename = Api::new()?.model(repo.to_string()).get(path)?;
        Ok(filename)
      },
    }
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
      },
      Err(e) => {
        println!("Failed to initialize CUDA device: {}. Falling back to CPU", e);
        Device::Cpu
      },
    }
  };
  let dtype = if args.use_f16 {
    println!("Using FP16 for reduced memory usage");
    DType::F16
  } else {
    println!("Using FP32");
    DType::F32
  };
  println!("Using {:?} data type", dtype);

  let sd_config = match args.sd_version {
    StableDiffusionVersion::Turbo => {
      println!("Configuring SDXL Turbo");
      stable_diffusion::StableDiffusionConfig::sdxl_turbo(None, args.height, args.width)
    },
    _ => {
      println!("Configuring SD v2.1");
      stable_diffusion::StableDiffusionConfig::v2_1(None, args.height, args.width)
    },
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
  println!("Downloading model files from: {}", repo);

  println!("Downloading model files...");
  let vae_file = ModelFile::Vae.get(None, args.sd_version, args.use_f16)?;
  let unet_file = ModelFile::Unet.get(None, args.sd_version, args.use_f16)?;
  let clip_file = ModelFile::Clip.get(None, args.sd_version, args.use_f16)?;
  let clip2_file = ModelFile::Clip2.get(None, args.sd_version, args.use_f16)?;
  let tokenizer = ModelFile::Tokenizer.get(None, args.sd_version, args.use_f16)?;
  let tokenizer2 = ModelFile::Tokenizer2.get(None, args.sd_version, args.use_f16)?;

  println!("Building models...");
  let vae = sd_config.build_vae(vae_file, &device, dtype)?;
  let unet = sd_config.build_unet(unet_file, &device, 4, false, dtype)?;

  // Build text encoders
  println!("Building text encoders...");
  let text_model = stable_diffusion::build_clip_transformer(&sd_config.clip, clip_file.clone(), &device, dtype)?;
  let text_model2 = stable_diffusion::build_clip_transformer(sd_config.clip2.as_ref().unwrap(), clip2_file.clone(), &device, dtype)?;

  // Tokenize and encode text
  println!("Processing text prompt...");
  let tokenizer = tokenizers::Tokenizer::from_file(tokenizer).map_err(E::msg)?;
  let tokenizer2 = tokenizers::Tokenizer::from_file(tokenizer2).map_err(E::msg)?;

  println!("Preparing text embeddings...");
  let which = match args.sd_version {
    StableDiffusionVersion::Xl | StableDiffusionVersion::XlInpaint | StableDiffusionVersion::Turbo => vec![true, false],
    _ => vec![true],
  };

  let guidance_scale = match args.guidance_scale {
    Some(guidance_scale) => guidance_scale,
    None => match args.sd_version {
      StableDiffusionVersion::V1_5 | StableDiffusionVersion::V1_5Inpaint | StableDiffusionVersion::V2_1 | StableDiffusionVersion::V2Inpaint | StableDiffusionVersion::XlInpaint | StableDiffusionVersion::Xl => 7.5,
      StableDiffusionVersion::Turbo => 0.,
    },
  };
  let use_guide_scale = guidance_scale > 1.0;

  // Clone the PathBufs before converting to strings
  let clip_file_str = clip_file.clone().to_string_lossy().to_string();
  let clip2_file_str = clip2_file.clone().to_string_lossy().to_string();

  let text_embeddings = which.iter().map(|first| text_embeddings(&args.prompt, &args.uncond_prompt, None, Some(clip_file_str.clone()), Some(clip2_file_str.clone()), args.sd_version, &sd_config, args.use_f16, &device, dtype, use_guide_scale, *first)).collect::<Result<Vec<_>>>()?;

  let text_embeddings = Tensor::cat(&text_embeddings, D::Minus1)?;
  println!("Text embeddings shape: {:?}", text_embeddings.shape());

  // Add this before latent initialization
  let vae_scale = match args.sd_version {
    StableDiffusionVersion::V1_5 | StableDiffusionVersion::V1_5Inpaint | StableDiffusionVersion::V2_1 | StableDiffusionVersion::V2Inpaint | StableDiffusionVersion::XlInpaint | StableDiffusionVersion::Xl => 0.18215,
    StableDiffusionVersion::Turbo => 0.13025,
  };
  println!("Using VAE scale factor: {}", vae_scale);

  // Add this section after building the VAE
  println!("Starting img2img processing...");
  let (image, init_latent_dist) = match &args.img2img {
    None => {
      println!("No input image provided, will generate from scratch");
      (None, None)
    },
    Some(image_path) => {
      println!("Processing input image from path: {}", image_path);
      let image = match image_preprocess(image_path) {
        Ok(img) => {
          println!("Successfully preprocessed input image");
          img
        },
        Err(e) => {
          println!("Failed to preprocess input image: {}", e);
          return Err(e);
        },
      };

      println!("Moving image to device and converting dtype...");
      let image = image.to_device(&device)?.to_dtype(dtype)?;
      println!("Image shape after preprocessing: {:?}", image.shape());

      println!("Encoding image through VAE...");
      let encoded = match vae.encode(&image) {
        Ok(encoded) => {
          println!("Successfully encoded image through VAE");
          encoded
        },
        Err(e) => {
          println!("Failed to encode image through VAE: {}", e);
          return Err(e.into());
        },
      };
      (Some(image.clone()), Some(encoded))
    },
  };

  println!("Calculating start step for diffusion process...");
  let t_start = if args.img2img.is_some() {
    let start = args.n_steps.unwrap_or(1) - (args.n_steps.unwrap_or(1) as f64 * args.img2img_strength) as usize;
    println!("Starting from step {} of {} (strength: {})", start, args.n_steps.unwrap_or(1), args.img2img_strength);
    start
  } else {
    println!("Starting from beginning (step 0)");
    0
  };

  println!("Initializing latents...");
  let latents = match &init_latent_dist {
    Some(init_latent_dist) => {
      println!("Generating latents from input image...");
      let latents = (init_latent_dist.sample()? * vae_scale)?.to_device(&device)?;
      println!("Initial latents shape: {:?}", latents.shape());

      if t_start < scheduler.timesteps().len() {
        println!("Adding noise to latents...");
        let noise = latents.randn_like(0f64, 1f64)?;
        scheduler.add_noise(&latents, noise, scheduler.timesteps()[t_start])?
      } else {
        println!("Using latents directly (no noise addition needed)");
        latents
      }
    },
    None => {
      println!("Generating random latents...");
      let latents = Tensor::randn(0f32, 1f32, (1, 4, sd_config.height / 8, sd_config.width / 8), &device)?;
      println!("Random latents shape: {:?}", latents.shape());
      // scale the initial noise by the standard deviation required by the scheduler
      (latents * scheduler.init_noise_sigma())?
    },
  };
  println!("Latents initialized successfully");

  // Get timesteps before the loop
  let timesteps: Vec<_> = scheduler.timesteps().iter().copied().collect();
  println!("Starting diffusion process...");
  let mut latents = latents;
  for (timestep_index, &timestep) in timesteps.iter().enumerate() {
    if timestep_index < t_start {
      continue;
    }
    println!("Processing step {}/{}", timestep_index + 1, timesteps.len());
    let latent_model_input = latents.clone();
    println!("Latent input shape: {:?}", latent_model_input.shape());

    println!("Scaling model input...");
    let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep)?;
    println!("Scaled input shape: {:?}", latent_model_input.shape());

    println!("Running UNet inference with timestep {}...", timestep);
    let noise_pred = match unet.forward(&latent_model_input, timestep as f64, &text_embeddings) {
      Ok(pred) => {
        println!("UNet inference successful");
        pred
      },
      Err(e) => {
        println!("UNet inference failed with error: {}", e);
        return Err(anyhow::anyhow!("UNet inference failed: {}", e));
      },
    };
    println!("Noise prediction shape: {:?}", noise_pred.shape());

    println!("Applying scheduler step...");
    latents = scheduler.step(&noise_pred, timestep, &latents)?;
    println!("Step {}/{} completed", timestep_index + 1, timesteps.len());
  }

  println!("Diffusion process completed, decoding image...");
  let image = vae.decode(&(latents.div(vae_scale)?))?;
  println!("VAE decode completed");
  let image = ((image.div(2.))? + 0.5)?.to_device(&Device::Cpu)?;
  println!("Normalized image values");
  let image = (image.clamp(0f32, 1.)? * 255.)?.to_dtype(DType::U8)?;
  println!("Converted to 8-bit format");

  save_image(&image.i(0)?, "temp.png")?;
  println!("Image generation completed successfully");

  Ok(())
}

#[allow(clippy::too_many_arguments)]
fn text_embeddings(prompt: &str, uncond_prompt: &str, tokenizer: Option<String>, clip_weights: Option<String>, clip2_weights: Option<String>, sd_version: StableDiffusionVersion, sd_config: &stable_diffusion::StableDiffusionConfig, use_f16: bool, device: &Device, dtype: DType, use_guide_scale: bool, first: bool) -> Result<Tensor> {
  let tokenizer_file = if first { ModelFile::Tokenizer } else { ModelFile::Tokenizer2 };
  let tokenizer = tokenizer_file.get(tokenizer, sd_version, use_f16)?;
  let tokenizer = Tokenizer::from_file(tokenizer).map_err(E::msg)?;
  let pad_id = match &sd_config.clip.pad_with {
    Some(padding) => *tokenizer.get_vocab(true).get(padding.as_str()).unwrap(),
    None => *tokenizer.get_vocab(true).get("<|endoftext|>").unwrap(),
  };

  println!("Running with prompt \"{prompt}\".");
  let mut tokens = tokenizer.encode(prompt, true).map_err(E::msg)?.get_ids().to_vec();
  if tokens.len() > sd_config.clip.max_position_embeddings {
    anyhow::bail!("the prompt is too long, {} > max-tokens ({})", tokens.len(), sd_config.clip.max_position_embeddings)
  }
  while tokens.len() < sd_config.clip.max_position_embeddings {
    tokens.push(pad_id)
  }
  let tokens = Tensor::new(tokens.as_slice(), device)?.unsqueeze(0)?;

  println!("Building the Clip transformer.");
  let clip_weights_file = if first { ModelFile::Clip } else { ModelFile::Clip2 };
  let clip_weights = if first { clip_weights_file.get(clip_weights, sd_version, use_f16)? } else { clip_weights_file.get(clip2_weights, sd_version, use_f16)? };
  let clip_config = if first { &sd_config.clip } else { sd_config.clip2.as_ref().unwrap() };
  let text_model = stable_diffusion::build_clip_transformer(clip_config, clip_weights, device, DType::F32)?;

  let text_embeddings = text_model.forward(&tokens)?;

  let text_embeddings = if use_guide_scale {
    let mut uncond_tokens = tokenizer.encode(uncond_prompt, true).map_err(E::msg)?.get_ids().to_vec();
    if uncond_tokens.len() > sd_config.clip.max_position_embeddings {
      anyhow::bail!("the negative prompt is too long, {} > max-tokens ({})", uncond_tokens.len(), sd_config.clip.max_position_embeddings)
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

fn image_preprocess<T: AsRef<std::path::Path>>(path: T) -> Result<Tensor> {
  let img = image::ImageReader::open(path)?.decode()?;
  let (height, width) = (img.height() as usize, img.width() as usize);
  let height = height - height % 32;
  let width = width - width % 32;
  let img = img.resize_to_fill(width as u32, height as u32, image::imageops::FilterType::CatmullRom);
  let img = img.to_rgb8();
  let img = img.into_raw();
  let img = Tensor::from_vec(img, (height, width, 3), &Device::Cpu)?.permute((2, 0, 1))?.to_dtype(DType::F32)?.affine(2. / 255., -1.)?.unsqueeze(0)?;
  Ok(img)
}

// fn main() -> Result<()> {
//     let args = Args::parse();
//     run(args)
// }
