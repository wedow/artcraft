use crate::ml::model_file::StableDiffusionVersion;
use crate::state::yaml_config::YamlConfig;
use candle_core::{DType, Device};
use candle_transformers::models::stable_diffusion::StableDiffusionConfig;
use filesys::recursively_find_file_by_name::recursively_find_file_by_name;
use hf_hub::api::sync::Api;
use log::info;

const CONFIG_FILENAME : &str = "app_config.yaml";

const DEFAULT_SD_IMAGE_WIDTH: usize = 512;
const DEFAULT_SD_IMAGE_HEIGHT: usize = 512;

const DEFAULT_SD_NUMERIC_DATATYPE: DType = DType::F32;
const SD_VERSION: StableDiffusionVersion = StableDiffusionVersion::Turbo;

/// A central place to configure app-wide details.
pub struct AppConfig {
  /// We only support one device type currently, and we can't multiplex 
  /// over several devices yet.
  pub device: Device,
  
  /// The core numeric type to use for models.
  pub dtype: DType,
  
  pub sd_version: StableDiffusionVersion,
  pub sd_config: StableDiffusionConfig,

  pub image_height: usize,
  pub image_width: usize,
  pub scheduler_steps: usize,
  pub scheduler_samples: usize,
  
  pub seed: Option<u64>,

  pub cfg_scale: Option<f64>,
  
  /// Probably shouldn't be here.
  pub hf_api: Api,
}

impl AppConfig {
  
  pub fn init() -> anyhow::Result<Self> {
    println!("Configuration filename: {}", CONFIG_FILENAME);
    let yaml_configs = load_yaml_configs();
    
    println!("Configs: {:?}", yaml_configs);
    
    let device = Device::new_cuda(0)
      .unwrap_or_else(|e| {
          info!("CUDA not available ({}), falling back to CPU", e);
          Device::Cpu
        });
    
    let sd_config = match SD_VERSION {
      StableDiffusionVersion::Turbo => {
        StableDiffusionConfig::sdxl_turbo(None, Some(DEFAULT_SD_IMAGE_HEIGHT), Some(DEFAULT_SD_IMAGE_WIDTH))
      }
      _ => {
        StableDiffusionConfig::v2_1(None, Some(DEFAULT_SD_IMAGE_HEIGHT), Some(DEFAULT_SD_IMAGE_WIDTH))
      }
    };
    
    let hf_api = Api::new()?;
    
    Ok(Self {
      device,
      dtype: DEFAULT_SD_NUMERIC_DATATYPE,
      sd_version: SD_VERSION,
      sd_config,
      image_height: yaml_configs.image_height.unwrap_or(DEFAULT_SD_IMAGE_HEIGHT),
      image_width: yaml_configs.image_width.unwrap_or(DEFAULT_SD_IMAGE_WIDTH),
      scheduler_steps: yaml_configs.scheduler_steps.unwrap_or(1),
      scheduler_samples: yaml_configs.scheduler_samples.unwrap_or(15),
      seed: yaml_configs.seed,
      cfg_scale: yaml_configs.cfg_scale,
      hf_api,
    })
  }
}

fn load_yaml_configs() -> YamlConfig {
  let maybe_path = recursively_find_file_by_name(CONFIG_FILENAME, "../../../", 5)
    .ok()
    .flatten();
  if let Some(path) = maybe_path {
    let path = path.canonicalize().unwrap_or(path);
    println!("Attempting to load configs from: {:?}", &path);
    if let Ok(config) = YamlConfig::read_from_file(path) {
      return config;
    }
  }
  println!("Loading default configs.");
  YamlConfig::default()
}
