use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use tauri::AppHandle;

pub async fn handle_image_fal(
  app: &AppHandle,
  request: &EnqueueTextToImageRequest,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  Err(GenerateError::FalNoLongerSupported)
}
