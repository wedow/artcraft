use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_to_video::artcraft::get_storyteller_creds_or_error::get_storyteller_creds_or_error;
use crate::core::commands::enqueue::image_to_video::artcraft::handle_artcraft_sora2::handle_artcraft_sora2;
use crate::core::commands::enqueue::image_to_video::artcraft::handle_artcraft_sora2_pro::handle_artcraft_sora2_pro;
use crate::core::commands::enqueue::image_to_video::enqueue_image_to_video_command::{EnqueueImageToVideoRequest, VideoModel};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use tauri::AppHandle;

pub async fn handle_video_artcraft(
  request: &EnqueueImageToVideoRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = get_storyteller_creds_or_error(app, storyteller_creds_manager)?;
  
  match request.model {
    None => {
      Err(GenerateError::no_model_specified())
    },
    Some(VideoModel::Sora2) => handle_artcraft_sora2(request, app_env_configs, &creds).await,
    Some(VideoModel::Sora2Pro) => handle_artcraft_sora2_pro(request, app_env_configs, &creds).await,
    Some(_) => {
      Err(GenerateError::AnyhowError(
        anyhow!("wrong logic: another branch should handle this: {:?}", request.model)))
    },
  }
}
