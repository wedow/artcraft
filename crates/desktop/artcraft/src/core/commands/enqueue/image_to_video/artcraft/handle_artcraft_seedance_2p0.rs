use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_to_video::enqueue_image_to_video_command::{EnqueueImageToVideoRequest, SoraOrientation};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::generation_events::common::{GenerationModel};
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{Seedance2p0AspectRatio, Seedance2p0MultiFunctionVideoGenRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::endpoints::generate::video::multi_function::seedance_2p0_multi_function_video_gen::seedance_2p0_multi_function_video_gen;

pub (super) async fn handle_artcraft_seedance_2p0(
  request: &EnqueueImageToVideoRequest,
  app_env_configs: &AppEnvConfigs,
  creds: &StorytellerCredentialSet,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let uuid_idempotency_token = generate_random_uuid();

  let aspect_ratio = match request.sora_orientation {
    Some(SoraOrientation::Portrait) => Seedance2p0AspectRatio::Portrait9x16,
    Some(SoraOrientation::Landscape) => Seedance2p0AspectRatio::Landscape16x9,
    None => Seedance2p0AspectRatio::Landscape16x9,
  };

  let request = Seedance2p0MultiFunctionVideoGenRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    start_frame_media_token: request.image_media_token.clone(),
    end_frame_media_token: request.end_frame_image_media_token.clone(),
    reference_image_media_tokens: None,
    aspect_ratio: Some(aspect_ratio),
    duration_seconds: None, // TODO: Parameterize
    batch_count: None,
  };

  let result = seedance_2p0_multi_function_video_gen(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;

  let job_token = match result {
    Ok(enqueued) => {
      info!("Successfully enqueued.");
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to enqueue: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::VideoGeneration,
    model: Some(GenerationModel::Seedance2p0),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_token.to_string()),
  })
}
