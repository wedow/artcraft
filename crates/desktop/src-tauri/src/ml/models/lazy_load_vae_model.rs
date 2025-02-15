use crate::ml::model_file::StableDiffusionVersion;
use anyhow::anyhow;
use candle_core::{DType, Device, Tensor};
use candle_transformers::models::stable_diffusion::vae::{AutoEncoderKL, DiagonalGaussianDistribution};
use candle_transformers::models::stable_diffusion::StableDiffusionConfig;
use hf_hub::api::sync::Api;
use std::sync::{Arc, RwLock};

pub struct LazyLoadVaeModel {
  lazy_model: Arc<RwLock<Option<AutoEncoderKL>>>,
  model_configs: VaeConfigs,
}

// TODO: Maybe we pass these via a central config read at startup, passed as an Arc<ConfigT>
pub struct VaeConfigs {
  sd_config: StableDiffusionConfig,
  sd_version: StableDiffusionVersion,
  device: Device,
  dtype: DType,
  hf_api: Api,
}

impl LazyLoadVaeModel {
  pub fn new(
    sd_config: &StableDiffusionConfig,
    sd_version: &StableDiffusionVersion,
    hf_api: &Api,
    device: &Device,
    dtype: DType,
  ) -> anyhow::Result<Self> {
    println!("building vae model... (1)");
    
    Ok(Self {
      lazy_model: Arc::new(RwLock::new(None)),
      model_configs: VaeConfigs {
        sd_config: sd_config.clone(),
        sd_version: sd_version.clone(),
        device: device.clone(),
        hf_api: hf_api.clone(),
        dtype
      }
    })
  }

  pub fn encode(&self, xs: &Tensor) -> anyhow::Result<DiagonalGaussianDistribution> {
    println!("vae encode...");
    match self.try_encode(xs) {
      Err(err) => Err(err),
      Ok(Some(result)) => Ok(result),
      Ok(None) => {
        // Model wasn't previously loaded
        self.load_model()?;
        self.try_encode(xs)?
          .ok_or(anyhow!("model was not previously loaded"))
      }
    }
  }
  
  pub fn decode(&self, xs: &Tensor) -> anyhow::Result<Tensor> {
    println!("vae decode...");
    match self.try_decode(xs) {
      Err(err) => Err(err),
      Ok(Some(result)) => Ok(result),
      Ok(None) => {
        // Model wasn't previously loaded
        self.load_model()?;
        self.try_decode(xs)?
          .ok_or(anyhow!("model was not previously loaded"))
      }
    }
  }

  fn try_encode(&self, xs: &Tensor) -> anyhow::Result<Option<DiagonalGaussianDistribution>> {
    match self.lazy_model.read() {
      Err(err) => Err(anyhow!("lock error: {:?}", err)),
      Ok(model) => {
        match &*model {
          None => Ok(None), // Model is not yet loaded
          Some(model) => {
            Ok(Some(model.encode(xs)?))
          }
        }
      }
    }
  }

  fn try_decode(&self, xs: &Tensor) -> anyhow::Result<Option<Tensor>> {
    match self.lazy_model.read() {
      Err(err) => Err(anyhow!("lock error: {:?}", err)),
      Ok(model) => {
        match &*model {
          None => Ok(None), // Model is not yet loaded
          Some(model) => {
            Ok(Some(model.decode(xs)?))
          }
        }
      }
    }
  }

  fn load_model(&self) -> anyhow::Result<()> {
    println!("load vae");
    match self.lazy_model.write() {
      Err(err) => return Err(anyhow!("lock error: {:?}", err)),
      Ok(mut maybe_model) => {
        match &*maybe_model {
          Some(_model) => {} // Already loaded; fall through
          None => {
            let repo = self.model_configs.sd_version.repo();

            println!("Building VAE model from : {:?} ... (3)", repo);
            
            let vae_file = self.model_configs.hf_api.model(repo.to_string())
              .get("vae/diffusion_pytorch_model.safetensors")?;

            println!("Building VAE model from file {:?}...", &vae_file);
            let vae = self.model_configs
              .sd_config
              .build_vae(vae_file, &self.model_configs.device, self.model_configs.dtype)?;

            println!("Built VAE...");
            *maybe_model = Some(vae);
          }
        }
      }
    }
    Ok(())
  }
 
}
