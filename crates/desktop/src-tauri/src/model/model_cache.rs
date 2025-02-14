use std::sync::{Arc, RwLock};
use once_cell::sync::Lazy;
use crate::model::unet_model::UNetModel;


static MODEL_CACHE: Lazy<Arc<RwLock<ModelCache>>> = Lazy::new(|| Arc::new(RwLock::new(ModelCache::new())));


// Simple registry for now. We can build complex machinery that aids in 
// VRAM utilization, disk space saving, intelligent scheduling, etc. in the future.
pub struct ModelCache {
  unet: Option<UNetModel>,
}

impl ModelCache {
  fn new() -> Self {
    Self { 
      unet: None 
    }
  }
}
