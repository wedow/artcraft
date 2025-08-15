use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use sqlx::{QueryBuilder, Sqlite};
use std::collections::HashSet;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct ListTasksByProviderAndStatusArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub provider: GenerationProvider,
  pub task_statuses: &'a HashSet<TaskStatus>,
}

pub struct TaskList {
  pub tasks: Vec<Task>,
}

#[derive(Debug, Clone)]
pub struct Task {
  pub id: TaskId,
  pub status: TaskStatus,
  pub task_type: TaskType,
  pub model_type: Option<TaskModelType>,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<String>,
  pub frontend_caller: Option<TauriCommandCaller>,
  pub frontend_subscriber_id: Option<String>,
  pub frontend_subscriber_payload: Option<String>,
}

#[derive(Debug)]
#[derive(sqlx::FromRow)]
struct RawTask {
  id: String,
  task_status: String,
  task_type: String,
  model_type: Option<String>,
  provider: String,
  provider_job_id: Option<String>,
  frontend_caller: Option<String>,
  frontend_subscriber_id: Option<String>,
  frontend_subscriber_payload: Option<String>,
}

pub async fn list_tasks_by_provider_and_status(
  args: ListTasksByProviderAndStatusArgs<'_>,
) -> Result<TaskList, SqliteTasksError> {

  let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(r#"
    SELECT
      id,
      task_status,
      task_type,
      model_type,
      provider,
      provider_job_id,
      frontend_caller,
      frontend_subscriber_id,
      frontend_subscriber_payload
    FROM tasks
    WHERE provider =
  "#);

  // TODO(bt,2025-07-15): Fix this. The sqlx mysql queries never required temporaries
  let provider = args.provider.to_string();

  query_builder.push_bind(provider);

  if !args.task_statuses.is_empty() {
    query_builder.push(" AND task_status IN (");
    let mut separated = query_builder.separated(", ");

    for task_status in args.task_statuses.into_iter() {
      separated.push_bind(task_status.to_str());
    }

    separated.push_unseparated(") ");
  }

  let query = query_builder.build_query_as::<RawTask>();

  // info!("Query: {:?}", query.sql());

  let results = query.fetch_all(args.db.get_pool()).await?;

  let mut tasks: Vec<Task> = Vec::new();

  for task in results {
    tasks.push(Task {
      id: TaskId::new_from_str(&task.id),
      status: TaskStatus::from_str(&task.task_status)
          .map_err(|err| SqliteTasksError::TaskParseError(err))?,
      task_type: TaskType::from_str(&task.task_type)
          .map_err(|err| SqliteTasksError::TaskParseError(err))?,
      model_type: task.model_type
          .map(|model| TaskModelType::from_str(&model)
              .map_err(|err| SqliteTasksError::TaskParseError(err)))
          .transpose()?,
      provider: GenerationProvider::from_str(&task.provider)
          .map_err(|err| SqliteTasksError::TaskParseError(err))?,
      provider_job_id: task.provider_job_id,
      frontend_caller: task.frontend_caller
          .map(|caller| TauriCommandCaller::from_str(&caller)
              .map_err(|err| SqliteTasksError::TaskParseError(err)))
          .transpose()?,
      frontend_subscriber_id: task.frontend_subscriber_id,
      frontend_subscriber_payload: task.frontend_subscriber_payload,
    });
  }

  Ok(TaskList {
    tasks,
  })
}
