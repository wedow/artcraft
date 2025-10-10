use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
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
use sqlite_tasks::queries::list_tasks_for_frontend::list_tasks_for_frontend;
use storyteller_client::endpoints::media_files::delete_media_file::delete_media_file;
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::sqlite::tasks::TaskId;

#[derive(Serialize)]
pub struct GetTaskQueueCommandResponse {
  tasks: Vec<TaskQueueItem>,
}

#[derive(Serialize)]
pub struct TaskQueueItem {
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
    &task_database,
  ).await;

  let tasks = match result {
    Ok(items) => items,
    Err(err) => {
      error!("get_task_queue_command failed: {:?}", err);
      return Err("get_task_queue_command failed".into())
    }
  };

  Ok(GetTaskQueueCommandResponse{
    tasks,
  }.into())
}

pub async fn handle_request(
  task_database: &TaskDatabase,
) -> AnyhowResult<Vec<TaskQueueItem>> {

  let tasks = list_tasks_for_frontend(task_database.get_connection())
      .await?;

  Ok(tasks.tasks.into_iter()
      .map(|task| TaskQueueItem {
        id: task.id,
        task_status: task.status,
        task_type: task.task_type,
        model_type: task.model_type,
        provider: task.provider,
        provider_job_id: task.provider_job_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
      })
      .collect())
}
