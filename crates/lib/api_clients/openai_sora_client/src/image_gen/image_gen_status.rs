use serde_derive::Deserialize;
use errors::AnyhowResult;
use crate::credentials::SoraCredentials;

const SORA_STATUS_URL: &str = "https://sora.com/backend/video_gen";

/// This user agent is tied to the sentinel generation. If we need to change it, we may need to change sentinel generation too.
const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct VideoGenStatusResponse {
    pub task_responses: Vec<TaskResponse>,
    pub last_id: String,
    pub has_more: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct TaskResponse {
    pub id: String,
    pub user: String,
    pub created_at: String,
    pub status: String,
    pub progress_pct: f64,
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
    pub inpaint_items: Vec<serde_json::Value>,
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

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Generation {
    pub id: String,
    pub task_id: String,
    pub created_at: String,
    pub deleted_at: Option<String>,
    pub url: String,
    pub seed: i64,
    pub can_download: bool,
    pub download_status: String,
    pub is_favorite: bool,
    pub is_liked: bool,
    pub is_public: bool,
    pub is_archived: bool,
    pub is_featured: bool,
    pub has_feedback: bool,
    pub like_count: i32,
    pub cloudflare_metadata: Option<serde_json::Value>,
    pub cf_thumbnail_url: Option<String>,
    pub encodings: Encodings,
    pub width: i32,
    pub height: i32,
    pub n_frames: i32,
    pub prompt: String,
    pub title: String,
    pub actions: Option<serde_json::Value>,
    pub inpaint_items: Option<serde_json::Value>,
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

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Encodings {
    pub source: Source,
    pub md: Option<serde_json::Value>,
    pub ld: Option<serde_json::Value>,
    pub thumbnail: Thumbnail,
    pub spritesheet: Option<serde_json::Value>,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Source {
    pub path: String,
    pub size: Option<i32>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub duration_secs: Option<f64>,
    pub ssim: Option<f64>,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Thumbnail {
    pub path: String,
    pub size: Option<i32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct User {
    pub id: String,
    pub username: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ModerationResult {
    pub r#type: String,
    pub results_by_frame_index: serde_json::Value,
    pub code: Option<String>,
    pub is_output_rejection: bool,
    pub task_id: String
}

pub struct StatusRequest {
    pub limit: Option<u32>,
    pub before: Option<String>,
}

/// Gets the status of image generation tasks from Sora API
pub async fn get_image_gen_status(status_request: StatusRequest, credentials: &SoraCredentials) -> AnyhowResult<VideoGenStatusResponse> {
    let client = reqwest::Client::new();
    
    let mut url = reqwest::Url::parse(SORA_STATUS_URL)?;
    
    // Add query parameters
    if let Some(limit) = status_request.limit {
        url.query_pairs_mut().append_pair("limit", &limit.to_string());
    }
    
    if let Some(before) = status_request.before {
        url.query_pairs_mut().append_pair("before", &before);
    }
    
    let http_request = client.get(url)
        .header("User-Agent", USER_AGENT)
        .header("Cookie", &credentials.cookie)
        .header("Authorization", credentials.authorization_header_value())
        .header("Content-Type", "application/json");
    
    let http_request = http_request.build()?;
    
    let response = client.execute(http_request)
        .await?;
    
    let status = response.status();
    
    let response_body = &response.text().await?;
    println!("response_body: {}", response_body);
    
    if status != reqwest::StatusCode::OK {
        return Err(anyhow::anyhow!("The status request failed; status = {:?}, message = {:?}", status, response_body));
    }
    
    let response: VideoGenStatusResponse = serde_json::from_str(response_body)?;
    
    Ok(response)
}
#[cfg(test)]
mod tests {
  use std::fs::read_to_string;
  use errors::AnyhowResult;
  use testing::test_file_path::test_file_path;
  use crate::credentials::SoraCredentials;
  use crate::image_gen::image_gen_status::{get_image_gen_status, StatusRequest};

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let sentinel = read_to_string(test_file_path("test_data/temp/sentinel.txt")?)?;
    let sentinel = sentinel.trim().to_string();

    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let creds = SoraCredentials {
      bearer_token: bearer,
      cookie,
      sentinel: Some(sentinel),
    };

    let response = get_image_gen_status(StatusRequest {
      limit: Some(1),
      before: Some("task_01jr8a5k6vev0b8zzdke95esn".to_string()),
    }, &creds).await?;

    println!("task_id: {}", response.task_responses[0].id);

    assert!(response.task_responses[0].id.starts_with("task_"));
    Ok(())
  }
}
