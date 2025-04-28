use crate::credentials::SoraCredentials;
use crate::requests::image_gen::image_gen_status::TaskStatus;
use crate::requests::image_gen::image_gen_status::{get_image_gen_status, StatusRequest, TaskResponse, VideoGenStatusResponse};
use errors::AnyhowResult;

pub async fn wait_for_image_gen_status(task_id: &String, credentials: &SoraCredentials, retry_limit: Option<u32>) -> AnyhowResult<TaskResponse> {
  let status_request = StatusRequest {
    limit: None,
    before: None,
    // before: Some(task_id.clone()),
  };
  let retry_limit = retry_limit.unwrap_or(10);

  for _ in 0..retry_limit {
    tokio::time::sleep(std::time::Duration::from_secs(10)).await;

    let status_response = get_image_gen_status(&status_request, credentials).await?;

    match find_task_response_by_id(&status_response, task_id.clone()) {
      Some(task_response) => match TaskStatus::from_str(&task_response.status) {
        TaskStatus::Succeeded => {
          return Ok(task_response.clone());
        },
        TaskStatus::Failed => {
          return Err(anyhow::anyhow!("Task failed"));
        },
        TaskStatus::Unknown(status) => {
          println!("Unknown task status: {}", status);
          continue;
        },
        TaskStatus::Queued => {
          println!("Task is queued");
          continue;
        },
        TaskStatus::Running => {
          println!("Task is running");
          continue;
        },
      },
      None => {
        return Err(anyhow::anyhow!("Task not found"));
      },
    }
  }

  Err(anyhow::anyhow!("Task not found"))
}

fn find_task_response_by_id(status_response: &VideoGenStatusResponse, task_id: String) -> Option<&TaskResponse> {
  status_response.task_responses.iter().find(|task| task.id == task_id)
}
