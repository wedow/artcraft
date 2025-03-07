use crate::ml::downloads::download_model_registry_file::download_model_registry_file;
use crate::ml::model_type::ModelType;
use crate::state::app_dir::AppDataRoot;

pub async fn download_all_models(app_data_root: &AppDataRoot) -> anyhow::Result<()> {
  let weights_dir = app_data_root.weights_dir();
  
  download_model_registry_file(ModelType::ClipJson, weights_dir).await?;
  download_model_registry_file(ModelType::SdxlTurboUnet, weights_dir).await?;
  download_model_registry_file(ModelType::SdxlTurboVae, weights_dir).await?;
  download_model_registry_file(ModelType::SdxlTurboClipEncoder, weights_dir).await?;
  download_model_registry_file(ModelType::SdxlTurboClipEncoder2, weights_dir).await?;
  
  Ok(())
}
