use std::{fs::File, io::Write, path::Path};

use crate::credentials::SoraCredentials;
use errors::AnyhowResult;
use reqwest::Url;
use serde_derive::Deserialize;

const SORA_STATUS_URL: &str = "https://sora.com/backend/video_gen";

/// This user agent is tied to the sentinel generation. If we need to change it, we may need to change sentinel generation too.
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
pub enum TaskStatus {
  Queued,
  Running,
  Succeeded,
  Failed,
  Unknown(String),
}

impl TaskStatus {
  pub fn from_str(s: &str) -> Self {
    match s {
      "queued" => TaskStatus::Queued,
      "running" => TaskStatus::Running,
      "succeeded" => TaskStatus::Succeeded,
      "failed" => TaskStatus::Failed,
      _ => TaskStatus::Unknown(s.to_string()),
    }
  }
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct VideoGenStatusResponse {
  pub task_responses: Vec<TaskResponse>,
  pub last_id: String,
  pub has_more: bool,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct TaskResponse {
  pub id: String,
  pub user: String,
  pub created_at: String,
  pub status: String,
  pub progress_pct: Option<f64>,
  pub progress_pos_in_queue: Option<i32>,
  pub estimated_queue_wait_time: Option<i32>,
  pub queue_status_message: Option<String>,
  pub priority: i32,
  pub r#type: String,
  pub prompt: String,
  pub n_variants: i32,
  pub n_frames: i32,
  pub height: i32,
  pub width: i32,
  pub model: Option<String>,
  pub operation: String,
  pub inpaint_items: Option<Vec<InpaintItem>>,
  pub preset_id: Option<String>,
  pub caption: Option<String>,
  pub actions: Option<serde_json::Value>,
  pub interpolation: Option<serde_json::Value>,
  pub sdedit: Option<serde_json::Value>,
  pub remix_config: Option<serde_json::Value>,
  pub quality: Option<String>,
  pub generations: Vec<Generation>,
  pub num_unsafe_generations: i32,
  pub title: String,
  pub moderation_result: ModerationResult,
  pub failure_reason: Option<String>,
  pub needs_user_review: bool,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct Generation {
  pub id: String,
  pub task_id: String,
  pub created_at: String,
  pub deleted_at: Option<String>,
  pub url: String,
  pub seed: Option<i64>,
  pub can_download: Option<bool>,
  pub download_status: Option<String>,
  pub is_favorite: Option<bool>,
  pub is_liked: Option<bool>,
  pub is_public: Option<bool>,
  pub is_archived: Option<bool>,
  pub is_featured: Option<bool>,
  pub has_feedback: Option<bool>,
  pub like_count: Option<i32>,
  pub cloudflare_metadata: Option<serde_json::Value>,
  pub cf_thumbnail_url: Option<String>,
  pub encodings: Encodings,
  pub width: i32,
  pub height: i32,
  pub n_frames: i32,
  pub prompt: String,
  pub title: String,
  pub actions: Option<serde_json::Value>,
  pub inpaint_items: Option<Vec<InpaintItem>>,
  pub interpolation: Option<serde_json::Value>,
  pub sdedit: Option<serde_json::Value>,
  pub operation: String,
  pub model: Option<String>,
  pub preset_id: Option<String>,
  pub user: User,
  pub moderation_result: ModerationResult,
  pub paragen_status: Option<serde_json::Value>,
  pub task_type: String,
  pub remix_config: Option<serde_json::Value>,
  pub quality: Option<String>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct Encodings {
  pub source: Source,
  pub md: Option<serde_json::Value>,
  pub ld: Option<serde_json::Value>,
  pub thumbnail: Thumbnail,
  pub spritesheet: Option<serde_json::Value>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct Source {
  pub path: String,
  pub size: Option<i32>,
  pub width: Option<i32>,
  pub height: Option<i32>,
  pub duration_secs: Option<f64>,
  pub ssim: Option<f64>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct Thumbnail {
  pub path: String,
  pub size: Option<i32>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct User {
  pub id: String,
  pub username: String,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct InpaintItem {
  pub crop_bounds: Option<String>,
  pub r#type: String,
  pub preset_id: Option<String>,
  pub generation_id: Option<String>,
  pub upload_media_id: String,
  pub frame_index: i32,
  pub source_start_frame: i32,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct ModerationResult {
  pub r#type: String,
  pub results_by_frame_index: serde_json::Value,
  pub code: Option<String>,
  pub is_output_rejection: bool,
  pub task_id: String,
}

pub struct StatusRequest {
  pub limit: Option<u32>,
  pub before: Option<String>,
}

impl StatusRequest {
  pub fn new(limit: Option<u32>, before: Option<String>) -> Self {
    let limit = limit.unwrap_or(100);
    Self { limit: Some(limit), before }
  }
}

/// Gets the status of image generation tasks from Sora API
pub async fn get_image_gen_status(status_request: &StatusRequest, credentials: &SoraCredentials) -> AnyhowResult<VideoGenStatusResponse> {
  let client = reqwest::Client::new();

  let mut url = reqwest::Url::parse(SORA_STATUS_URL)?;

  // Add query parameters
  if let Some(limit) = status_request.limit {
    url.query_pairs_mut().append_pair("limit", &limit.to_string());
  }

  if let Some(before) = &status_request.before {
    url.query_pairs_mut().append_pair("before", &before);
  }

  let http_request = client.get(url).header("User-Agent", USER_AGENT).header("Cookie", &credentials.cookie).header("Authorization", credentials.authorization_header_value()).header("Content-Type", "application/json");

  let http_request = http_request.build()?;

  let response = client.execute(http_request).await?;

  let status = response.status();

  let response_body = &response.text().await?;
  println!("response_body: {}", response_body);

  if status != reqwest::StatusCode::OK {
    return Err(anyhow::anyhow!("The status request failed; status = {:?}, message = {:?}", status, response_body));
  }

  let response: VideoGenStatusResponse = serde_json::from_str(response_body)?;

  Ok(response)
}

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

pub async fn save_generations_to_dir(generations: &[Generation], dir: &str) -> AnyhowResult<()> {
  let dir = Path::new(dir);
  if !dir.exists() {
    std::fs::create_dir_all(dir)?;
  }
  for generation in generations {
    let response = reqwest::get(generation.url.clone()).await?;
    let image_bytes = response.bytes().await?;

    let url = Url::parse(&generation.url)?;
    let ext = url.path().split(".").last().unwrap_or("png");
    let path = Path::new(dir).join(format!("{}.{}", generation.id, ext));

    let mut file = File::create(path)?;
    file.write_all(&image_bytes)?;

    let thumbnail_url = generation.encodings.thumbnail.path.clone();
    let thumbnail_response = reqwest::get(thumbnail_url).await?;
    let thumbnail_bytes = thumbnail_response.bytes().await?;
    let thumbnail_path = Path::new(dir).join(format!("{}_thumbnail.{}", generation.id, ext));
    let mut thumbnail_file = File::create(thumbnail_path)?;
    thumbnail_file.write_all(&thumbnail_bytes)?;
  }

  Ok(())
}

fn find_task_response_by_id(status_response: &VideoGenStatusResponse, task_id: String) -> Option<&TaskResponse> {
  status_response.task_responses.iter().find(|task| task.id == task_id)
}

#[cfg(test)]
mod tests {
  use crate::credentials::SoraCredentials;
  use crate::image_gen::image_gen_status::{get_image_gen_status, save_generations_to_dir, wait_for_image_gen_status, StatusRequest, VideoGenStatusResponse};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use testing::test_file_path::test_file_path;

  #[ignore]
  #[tokio::test]
  pub async fn test_deserialize_status_response() -> AnyhowResult<()> {
    let response = read_to_string(test_file_path("test_data/image_gen/test_status_response_long.json")?)?;
    let _response: VideoGenStatusResponse = serde_json::from_str(&response)?;
    Ok(())
  }

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let sentinel = read_to_string(test_file_path("test_data/temp/sentinel.txt")?)?;
    let sentinel = sentinel.trim().to_string();

    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let creds = SoraCredentials { bearer_token: bearer, cookie, sentinel: Some(sentinel) };
    // Get the task status for a specific task
    // let response = get_image_gen_status(&StatusRequest::new(None, Some("task_01jr9yvpfyetx9r7qvvx38scna".to_string())), &creds).await?;

    let response = get_image_gen_status(&StatusRequest::new(Some(50), None), &creds).await?;
    println!("task_id: {}", response.task_responses[0].id);

    let task_id = response.task_responses[0].id.clone();
    let task_response = wait_for_image_gen_status(
      &task_id,
      &creds,
      Some(10)
    ).await?;

    assert!(task_response.status == "succeeded");
    Ok(())
  }

  #[ignore]
  #[tokio::test]
  pub async fn test_save_generations_to_dir() -> AnyhowResult<()> {
    let response = read_to_string(test_file_path("test_data/image_gen/test_status_response_long.json")?)?;
    let response: VideoGenStatusResponse = serde_json::from_str(&response)?;
    save_generations_to_dir(&response.task_responses[0].generations, test_file_path("test_data/image_gen/generations")?.to_str().unwrap()).await?;
    Ok(())
  }
}
