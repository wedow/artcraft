use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use chrono::{DateTime, Utc};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use errors::AnyhowResult;
use log::{error, info, warn};
use serde_derive::{Deserialize, Serialize};
use storyteller_client::endpoints::media_files::delete_media_file::delete_media_file;
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::sqlite::tasks::TaskId;

#[derive(Serialize)]
pub struct GetTaskQueueCommandResponse {
  tasks: Vec<TaskQueueTask>,
}

#[derive(Serialize)]
pub struct TaskQueueTask {
  pub id: TaskId,
  pub task_status: TaskStatus,
  pub task_type: TaskType,
  pub model_type: Option<TaskModelType>,
  pub provider: Option<GenerationProvider>,
  pub provider_job_id: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub completed_at: Option<DateTime<Utc>>,
}

impl SerializeMarker for GetTaskQueueCommandResponse {}

#[tauri::command]
pub async fn get_task_queue_command(
  app: AppHandle,
  app_env_configs: State<'_, AppEnvConfigs>,
  task_database: State<'_, TaskDatabase>,
) -> ResponseOrErrorMessage<GetTaskQueueCommandResponse> {

  info!("get_task_queue_command called");

  let result = handle_request(
    &app,
    &app_env_configs,
    &task_database,
  ).await;

  if let Err(err) = result {
    error!("get_task_queue_command failed: {:?}", err);
    return Err("get_task_queue_command failed".into())
  }

  Ok(GetTaskQueueCommandResponse{}.into())
}

pub async fn handle_request(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  task_database: State<'_, TaskDatabase>,
) -> AnyhowResult<()> {

  let creds = storyteller_creds_manager.get_credentials()?;

  let _result = delete_media_file(
    &app_env_configs.storyteller_host,
    creds.as_ref(),
    &request.media_file_token
  ).await?;

  // TODO: Send event to frontend that the file was deleted.

  Ok(())
}
