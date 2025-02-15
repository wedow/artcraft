use std::path::PathBuf;
use crate::ml::model_file::StableDiffusionVersion;
use crate::ml::models::lazy_load_vae_model::LazyLoadVaeModel;
use candle_core::{DType, Device, Tensor};
use crate::ml::model_cache::ModelCache;

/// Generates the mask latents, scaled mask and mask_4 for inpainting. 
/// Returns a tuple of None if inpainting is not being used.
#[allow(clippy::too_many_arguments)]
pub fn create_inpainting_tensors(
  sd_version: StableDiffusionVersion,
  mask_path: Option<PathBuf>,
  dtype: DType,
  device: &Device,
  use_guide_scale: bool,
  model_cache: &ModelCache,
  image: Option<Tensor>,
  vae_scale: f64,
) -> anyhow::Result<(Option<Tensor>, Option<Tensor>, Option<Tensor>)> {
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
      let mask_latents = model_cache.vae_encode(&masked_img)?;
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
    //.div(255.0)? // TODO(bt): Need to figure out what changed in candle to no longer permit division by f64
    .unsqueeze(0)?;
  Ok(mask)
}
