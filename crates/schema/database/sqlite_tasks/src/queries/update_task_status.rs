use crate::connection::TaskDbConnection;
use crate::error::SqliteTasksError;
use enums::tauri::tasks::task_status::TaskStatus;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct UpdateTaskArgs<'a> {
  pub db: &'a TaskDbConnection,
  pub task_id: TaskId,
  pub status: TaskStatus,
}

pub async fn update_task_status(
  args: UpdateTaskArgs<'_>,
) -> Result<(), SqliteTasksError> {

  // TODO(bt,2025-07-12): Fix this. The sqlx mysql queries never required temporaries
  let task_id_temp = args.task_id.as_str();
  let status_temp = args.status.to_str();

  // TODO(bt,2025-07-15): We can't use a LIMIT without a certain compiler flag ?
  let query = sqlx::query!(r#"
    UPDATE tasks
    SET task_status = ?
    WHERE id = ?
  "#,
      task_id_temp,
      status_temp,
  );

  let _r = query.execute(args.db.get_pool()).await?;

  Ok(())
}
