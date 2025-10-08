use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct CreateTaskArgs<'a> {
  pub status: TaskStatus,
  pub task_type: TaskType,
  pub model_type: Option<TaskModelType>,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<&'a str>,
  pub frontend_caller: Option<TauriCommandCaller>,
  pub frontend_subscriber_id: Option<&'a str>,
  pub frontend_subscriber_payload: Option<&'a str>,
}
pub struct TaskList {
  pub tasks: Vec<TaskItem>,
}

pub struct TaskItem {
  pub status: TaskStatus,
  pub task_type: TaskType,
  pub model_type: Option<TaskModelType>,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<String>,
  pub frontend_caller: Option<TauriCommandCaller>,
  pub frontend_subscriber_id: Option<String>,
  pub frontend_subscriber_payload: Option<String>,
}

pub async fn list_tasks_for_frontend(
  db: & TaskDbConnection
) -> Result<TaskList, SqliteTasksError> {
  let task_id = TaskId::generate();

  //model_type,
  //frontend_caller,
  let query = sqlx::query_as!(
    TaskItemRaw,
    r#"
    SELECT
      id,
      task_status,
      task_type,
      provider,
      provider_job_id,
      frontend_subscriber_id,
      frontend_subscriber_payload
    FROM tasks
  "#);

  let _r = query.fetch(db.get_pool()).await?;

  Ok(())
}

//fn query(&self) -> Query<MySql, MySqlArguments> {
//}



struct TaskItemRaw {
  id: String,
  task_status: String,
  task_type: String,
  //model_type: Option<String>,
  //id: TaskId,
  //task_status: TaskStatus,
  //task_type: TaskType,
  //model_type: Option<TaskModelType>,
  provider: Option<String>,
  provider_job_id: Option<String>,
  //frontend_caller: Option<TauriCommandCaller>,
  frontend_subscriber_id: Option<String>,
  frontend_subscriber_payload: Option<String>,
}

