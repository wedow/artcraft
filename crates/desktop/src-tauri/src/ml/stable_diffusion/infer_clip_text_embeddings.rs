#[cfg(feature = "accelerate")]
extern crate accelerate_src;
#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

use std::path::PathBuf;
use candle_transformers::models::stable_diffusion;

use crate::ml::model_file::{ModelFile, StableDiffusionVersion};
use anyhow::Error as E;
use candle_core::{DType, Device, Module, Tensor, D};
use log::info;
use tokenizers::Tokenizer;
use crate::ml::model_type::ModelType;
use crate::state::app_dir::AppWeightsDir;

#[allow(clippy::too_many_arguments)]
pub fn infer_clip_text_embeddings(
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
  weights_dir: &AppWeightsDir,
) -> anyhow::Result<Tensor> {
  info!("Preparing text embeddings...");

  let which = match sd_version {
    StableDiffusionVersion::Xl
    | StableDiffusionVersion::XlInpaint
    | StableDiffusionVersion::Turbo => vec![true, false],
    _ => vec![true],
  };

  let text_embeddings = which
    .iter()
    .map(|first| {
      do_infer_clip_text_embeddings(
        &prompt,
        &uncond_prompt,
        None, // tokenizer
        None, // clip_weights
        None, // clip2_weights
        sd_version,
        &sd_config,
        false, // use_f16
        &device,
        dtype,
        use_guide_scale,
        *first,
        weights_dir,
      )
    })
    .collect::<anyhow::Result<Vec<_>>>()?;

  let text_embeddings = Tensor::cat(&text_embeddings, D::Minus1)?;
  
  Ok(text_embeddings)
}

#[allow(clippy::too_many_arguments)]
fn do_infer_clip_text_embeddings(
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
    weights_dir: &AppWeightsDir,
  ) -> anyhow::Result<Tensor> {
  
  let tokenizer_file = if first {
    info!("ModelFile::Tokenizer");
    ModelFile::Tokenizer
  } else {
    info!("ModelFile::Tokenizer2");
    ModelFile::Tokenizer2
  };
  
  info!("Loading clip from download");
  //let tokenizer = tokenizer_file.get(tokenizer, sd_version, use_f16)?;
  let tokenizer = weights_dir.model_path(&ModelType::ClipJson);
  
  info!("Tokenizer path: {:?}", tokenizer);
  
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
    //clip_weights_file.get(clip_weights, sd_version, use_f16)?
    weights_dir.model_path(&ModelType::SdxlTurboClipEncoder)
  } else {
    //clip_weights_file.get(clip2_weights, sd_version, use_f16)?
    weights_dir.model_path(&ModelType::SdxlTurboClipEncoder2)
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
