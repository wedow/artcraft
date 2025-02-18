use std::fs::File;
use std::io::BufReader;
use std::path::Path;

/// Configuration read or derived from a YAML config file at startup
/// This is not meant to contain any runtime config values.
/// This may not be exhaustive.
#[derive(serde::Deserialize, serde::Serialize, Clone, Debug, Default)]
pub struct YamlConfig {
  pub image_height: Option<usize>,
  pub image_width: Option<usize>,
  pub scheduler_steps: Option<usize>,
  pub scheduler_samples: Option<usize>,
  pub seed: Option<u64>,
}

impl YamlConfig {
  pub fn read_from_file<P: AsRef<Path>>(path: P) -> anyhow::Result<Self> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let config = serde_yaml::from_reader(reader)?;
    Ok(config)
  }
}
