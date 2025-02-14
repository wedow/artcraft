use candle_core::{DType, Device, Tensor};
use candle_transformers::models::stable_diffusion::unet_2d::UNet2DConditionModel;
use candle_transformers::models::stable_diffusion::StableDiffusionConfig;
use std::path::Path;

pub struct UNetModel {
  model: UNet2DConditionModel,
}

impl UNetModel {
  pub fn new<P: AsRef<Path>>(
    sd_config: &StableDiffusionConfig,
    unet_weights_file: P,
    device: &Device,
    dtype: DType,
  ) -> anyhow::Result<Self> {
    println!("building unet model... (1)");
    
    let model = sd_config.build_unet(
      unet_weights_file, 
      &device, 
      4, 
      false, 
      dtype
    )?;
    
    Ok(Self {
      model,
    })
  }
  
  pub fn inference(&self, latent_model_input: &Tensor, timestep: f64, text_embeddings: &Tensor) -> anyhow::Result<Tensor> {
    Ok(self.model.forward(&latent_model_input, timestep, &text_embeddings)?)
  }
}
