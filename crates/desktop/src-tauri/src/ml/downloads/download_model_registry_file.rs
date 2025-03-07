use crate::ml::model_type::ModelType;
use crate::state::app_dir::AppWeightsDir;
use log::info;
use std::fs::File;
use std::path::{Path, PathBuf};

pub async fn download_model_registry_file(
  model_type: ModelType,
  weights_dir: &AppWeightsDir,
) -> anyhow::Result<PathBuf> {
  
  let path = weights_dir.model_path(&model_type);

  if path.exists() {
    return Ok(path);
  }

  info!("downloading model: {:?} to {:?}", model_type, path);

  let body = reqwest::get(model_type.get_download_url())
    .await?
    .bytes()
    .await?;
  
  let _file = File::create(&path)?;
  
  std::fs::write(&path, body.as_ref())?;
  
  Ok(path)
}
