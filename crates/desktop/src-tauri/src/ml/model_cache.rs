use crate::ml::models::unet_model::UNetModel;
use crate::ml::model_file::StableDiffusionVersion;
use anyhow::anyhow;
use candle_core::{DType, Device, Tensor};
use candle_transformers::models::stable_diffusion::StableDiffusionConfig;
use hf_hub::api::sync::Api;
use std::sync::{Arc, RwLock};
use candle_transformers::models::stable_diffusion::vae::DiagonalGaussianDistribution;
use crate::ml::models::lazy_load_vae_model::LazyLoadVaeModel;
// TODO: This data structure is gross. Generalize the locking and loading semantics for reuse.

// Simple registry for now. We can build complex machinery that aids in 
// VRAM utilization, disk space saving, intelligent scheduling, etc. in the future.
pub struct ModelCache {
  // TODO(bt,2025-02-14): Support for more than one device in the future.
  device: Device,
  dtype: DType,
  hf_api: Api,
  sd_config: StableDiffusionConfig,
  sd_version: StableDiffusionVersion,
  
  unet: Arc<RwLock<Option<UNetModel>>>,
  lazy_vae: LazyLoadVaeModel,
}

impl ModelCache {
  pub fn new(
    device: Device, 
    dtype: DType,
    sd_version: StableDiffusionVersion, 
    sd_config: StableDiffusionConfig,
  ) -> anyhow::Result<Self> {
    let api = Api::new()?;
    
    Ok(Self { 
      device: device.clone(),
      dtype,
      hf_api: api.clone(),
      unet: Arc::new(RwLock::new(None)),
      lazy_vae: LazyLoadVaeModel::new(
        &sd_config,
        &sd_version,
        &api,
        &device,
        dtype,
      )?,
      sd_config,
      sd_version,
    })
  }

  pub fn vae_encode(&self, xs: &Tensor) -> anyhow::Result<DiagonalGaussianDistribution> {
    self.lazy_vae.encode(xs)
  }

  pub fn vae_decode(&self, xs: &Tensor) -> anyhow::Result<Tensor> {
    self.lazy_vae.decode(xs)
  }
  
  pub fn unet_inference(&self, latent_model_input: &Tensor, timestep: f64, text_embeddings: &Tensor) -> anyhow::Result<Tensor> {
    println!("unet_inference");
    match self.try_unet_inference(latent_model_input, timestep, text_embeddings) {
      Err(err) => Err(err),
      Ok(Some(result)) => Ok(result),
      Ok(None) => {
        // Model wasn't previously loaded
        self.load_unet()?;
        self.try_unet_inference(latent_model_input, timestep, text_embeddings)?
          .ok_or(anyhow!("model was not previously loaded"))
      }
    }
  }
  
  fn load_unet(&self) -> anyhow::Result<()> {
    println!("load_unet");
    match self.unet.write() {
      Err(err) => return Err(anyhow!("lock error: {:?}", err)),
      Ok(mut maybe_model) => {
        match &*maybe_model {
          Some(_model) => {} // Fall through
          None => {
            let repo = self.sd_version.repo();
            
            println!("Downloading UNET model files from: {} ...", repo);

            let unet_file = self.hf_api.model(repo.to_string())
              .get("unet/diffusion_pytorch_model.safetensors")
              .map_err(|err| anyhow!("error fetching model: {:?}", err))?;

            println!("Building UNET model... (3)");
            let unet = UNetModel::new(&self.sd_config, unet_file, &self.device, self.dtype)
              .map_err(|err| anyhow!("error initializing unet model: {:?}", err))?;

            println!("Built UNET...");
            *maybe_model = Some(unet);
          }
        }
      }
    }
    Ok(())
  }

  pub fn try_unet_inference(&self, latent_model_input: &Tensor, timestep: f64, text_embeddings: &Tensor) -> anyhow::Result<Option<Tensor>> {
    println!("try_unet_inference");
    match self.unet.read() {
      Ok(mut model) => {
        match &*model {
          None => Ok(None), // Model is not yet loaded
          Some(model) => {
            Ok(Some(model.inference(latent_model_input, timestep, text_embeddings)?))
          }
        }
      }
      Err(err) => Err(anyhow!("lock error: {:?}", err)),
    }
  }
  
}
