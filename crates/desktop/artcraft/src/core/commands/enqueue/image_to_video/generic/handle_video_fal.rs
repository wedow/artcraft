use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_to_video::enqueue_image_to_video_command::EnqueueImageToVideoRequest;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use tauri::AppHandle;

pub async fn handle_video_fal(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  request: EnqueueImageToVideoRequest,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  Err(GenerateError::FalNoLongerSupported)
}
