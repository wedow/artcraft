use log::info;
use sqlx::Execute;
use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::tauri::tasks::task_status::TaskStatus;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct UpdateTaskArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub task_id: &'a TaskId,
  pub status: TaskStatus,
}

pub async fn update_task_status(
  args: UpdateTaskArgs<'_>,
) -> Result<(), SqliteTasksError> {

  // TODO(bt,2025-07-12): Fix this. The sqlx mysql queries never required temporaries
  let task_id_temp = args.task_id.as_str();
  let status_temp = args.status.to_str();

  info!("Update task id: {}, status: {}", task_id_temp, status_temp);

  // TODO(bt,2025-07-15): We can't use a LIMIT without a certain compiler flag ?
  let query = sqlx::query!(r#"
    UPDATE tasks
    SET task_status = ?
    WHERE id = ?
  "#,
      status_temp,
      task_id_temp,
  );

  info!("query: {:?}", query.sql());

  let res = query.execute(args.db.get_pool()).await?;

  info!("Updated rows: {}", res.rows_affected());

  Ok(())
}
