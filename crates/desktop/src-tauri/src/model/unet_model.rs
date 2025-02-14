use anyhow::anyhow;
use candle_core::{DType, Device, Tensor};
use candle_transformers::models::stable_diffusion::unet_2d::UNet2DConditionModel;
use candle_transformers::models::stable_diffusion::StableDiffusionConfig;
use std::path::Path;
use std::sync::{Arc, RwLock};
use log::debug;

#[derive(Clone)]
pub struct UNetModel {
  // Kasisnu - a few notes: 
  //
  // (1) This struct has what Rust terms as "interior mutability". We can now pass around 
  // "immutable" references to the struct, yet mutate what's inside with non-mut (!) functions. 
  // The callers don't know, and because the struct has safety guarantees of "Send + Sync", it's 
  // provably sound. This allows multiple threads / scopes to mutate the structure. They just wait 
  // on the lock/mutex to synchronize.
  //
  // (2) Another cool thing we can do is mark this struct as "Clone"  since the Arc<T> pointer is
  // super cheap to duplicate (you'd never do that with a wide type or anything beyond int64 
  // size). It makes passing this structure along smooth as butter. The only penalty we pay is the 
  // unlocking of the mutex (actually rwlock in this case) and the (minor) indirection behind Arc.
  // We don't mark it Copy, though, since it does ref counting and manages its own allocation, which 
  // shouldn't be implicit.
  model: Arc<RwLock<UNet2DConditionModel>>,
}

impl UNetModel {
  pub fn new<P: AsRef<Path>>(
    sd_config: &StableDiffusionConfig,
    unet_weights_file: P,
    device: &Device,
    dtype: DType,
  ) -> anyhow::Result<Self> {
    debug!("building unet model...");
    
    let unet = sd_config.build_unet(
      unet_weights_file, 
      &device, 
      4, 
      false, 
      dtype
    )?;
    
    Ok(Self {
      model: Arc::new(RwLock::new(unet)),
    })
  }
  
  pub fn inference(&self, latent_model_input: &Tensor, timestep: f64, text_embeddings: &Tensor) -> anyhow::Result<Tensor> {
    match self.model.read() {
      Err(err) => return Err(anyhow!("lock error: {:?}", err)),
      Ok(model) => {
        debug!("Running model prediction...");
        let inference_result = model.forward(&latent_model_input, timestep, &text_embeddings);

        let noise_pred = match inference_result {
          Ok(pred) => {
            debug!("Inference successful");
            pred
          },
          Err(e) => {
            debug!("UNet inference failed with error: {}", e);
            return Err(anyhow!("UNet inference failed: {}", e));
          }
        };
        
        Ok(noise_pred)
      }
    }
  }
}
