use crate::creds::credential_migration::CredentialMigrationRef;
use crate::requests::image_gen::image_gen_status::TaskId;
use log::warn;
use serde_derive::{Deserialize, Serialize};
use std::time::Duration;
use thiserror::Error;

const SORA_IMAGE_GEN_URL: &str = "https://sora.com/backend/video_gen";

/// This user agent is tied to the sentinel generation. If we need to change it, we may need to change sentinel generation too.
const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

#[derive(Error, Debug)]
pub enum SoraImageGenError {
  #[error("Sora token expired: {0}")]
  TokenExpired(String),

  #[error("Sora sentinel block: {0}")]
  SentinelBlock(String),

  #[error("Sora too many concurrent tasks: {0}")]
  TooManyConcurrentTasks(String),

  #[error("Sora invalid JWT: {0}")]
  InvalidJwt(String),

  #[error("Sora API error: {0}")]
  GenericError(String),

  #[error("Network error: {0}")]
  NetworkError(String),

  #[error("Sora username required: {0}")]
  UsernameRequired(String),
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) enum VideoGenType {
  ImageGen,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) enum OperationType {
  /// Simple prompt without reference images
  SimpleCompose,
  /// Prompt with reference images
  Remix,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) enum InpaintItemType {
  Image,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) struct InpaintItem {
  pub r#type: InpaintItemType,
  /// Typically "0"
  pub frame_index: u32,
  /// Unknown field; defaults to null
  pub preset_id: Option<String>,
  /// Unknown field; defaults to null
  pub generation_id: Option<String>,
  /// Token identifier of the item, eg. "media_01jqt9vt20erx9zvryf3v1pecx"
  pub upload_media_id: String,
  /// Typically "0"
  pub source_start_frame: u32,
  /// Typically "0"
  pub source_end_frame: u32,
  /// Unknown field; defaults to null
  pub crop_bounds: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) struct RawSoraImageGenRequest {
  /// eg. "image_gen"
  pub r#type: VideoGenType,
  /// eg. "simple_compose"
  pub operation: OperationType,
  /// The user's raw prompt
  pub prompt: String,
  /// The number of variants to generate, eg. 2
  pub n_variants: usize,
  /// The width of the image, eg. 480
  pub width: u16,
  /// The height of the image, eg. 480
  pub height: u16,
  /// The number of frames to generate, eg. 1
  pub n_frames: u8,
  /// The items to inpaint, eg. []
  pub inpaint_items: Vec<InpaintItem>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) struct RawSoraResponse {
  /// eg. "task_01jqsz9dsae9tvjygf1abrv3xf"
  pub id: TaskId,
  /// not known
  pub priority: Option<String>,
}

// https://sora.com/backend/notif?limit=100&before=task_01jqpg8qghenet0rw2a79p0vbn
// error
// message	"Missing bearer authentication in header"
// type	"invalid_request_error"
// param	null
// code	null
#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub struct RawSoraErrorResponse {
  error: RawSoraErrorInner,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum RawSoraError {
  Error(RawSoraErrorInner),
  Unknown(String),
}


#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum SoraErrorCode {
  SentinelBlock,
  InvalidJwt,
  TokenExpired,
  TooManyConcurrentTasks,
  UsernameRequired,
  Unknown(String),
}


#[derive(Deserialize, Debug, Clone, Error)]
#[serde(rename_all = "snake_case")]
pub struct RawSoraErrorInner {
  message: String,
  r#type: String,
  param: Option<String>,
  code: Option<SoraErrorCode>,
}

impl std::fmt::Display for RawSoraErrorInner {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "Sora API error: {}", self.message)
  }
}

/// Don't expose the internal request implementation as there are only a few "correct" ways to call the API.
pub (crate) async fn image_gen_http_request(
  sora_request: RawSoraImageGenRequest, 
  credentials: CredentialMigrationRef<'_>, 
  request_timeout: Option<Duration>,
) -> Result<RawSoraResponse, SoraImageGenError> {
  let client = reqwest::Client::new();

  let mut cookie;
  let mut authorization_header;
  let mut sentinel;

  match credentials {
    CredentialMigrationRef::Legacy(creds) => {
      cookie = creds.cookie.clone();
      authorization_header = creds.authorization_header_value();
      // TODO(bt,2025-04-23): We're using a Sora payload error in place of application state error. Surface this differently.
      sentinel = creds.sentinel.as_ref()
          .map(|sentinel| sentinel.to_string())
          .ok_or(SoraImageGenError::SentinelBlock("Sentinel is required for image generation.".to_string()))?;
    }
    CredentialMigrationRef::New(creds) => {
      cookie = creds.cookies.to_string();
      // TODO(bt,2025-04-23): We're using a Sora payload error in place of application state error. Surface this differently.
      authorization_header = creds.jwt_bearer_token.as_ref()
          .ok_or(SoraImageGenError::InvalidJwt("JWT bearer is required for image generation".to_string()))?
          .to_authorization_header_value();
      // TODO(bt,2025-04-23): We're using a Sora payload error in place of application state error. Surface this differently.
      sentinel = creds.sora_sentinel.as_ref()
          .map(|sentinel| sentinel.get_sentinel().to_string())
          .ok_or(SoraImageGenError::SentinelBlock("Sentinel is required for image generation.".to_string()))?;
    }
  }

  let mut http_request = client.post(SORA_IMAGE_GEN_URL)
      .header("User-Agent", USER_AGENT)
      .header("Cookie", &cookie)
      .header("Authorization", &authorization_header)
      .header("Content-Type", "application/json")
      .header("OpenAI-Sentinel-Token", &sentinel);
  
  
  if let Some(timeout) = request_timeout {
    http_request = http_request.timeout(timeout);
  }

  let http_request = http_request.json(&sora_request).build()
      .map_err(|e| SoraImageGenError::NetworkError(e.to_string()))?;

  let response = client.execute(http_request)
      .await
      .map_err(|e| SoraImageGenError::NetworkError(e.to_string()))?;

  let status = response.status();

  let response_body = &response.text().await
      .map_err(|e| SoraImageGenError::NetworkError(e.to_string()))?;

  if status != reqwest::StatusCode::OK {
    warn!("Sora image generation failure. Raw response: {:?}", response_body);
    
    let error_response: RawSoraErrorResponse = serde_json::from_str(response_body)
        .map_err(|e| SoraImageGenError::GenericError(format!("Failed to parse error response: {}", e)))?;

    // Check for specific error codes
    if let Some(code) = &error_response.error.code {
      match code {
        SoraErrorCode::TokenExpired => {
          return Err(SoraImageGenError::TokenExpired(error_response.error.message));
        }
        SoraErrorCode::SentinelBlock => {
          return Err(SoraImageGenError::SentinelBlock(error_response.error.message));
        }
        SoraErrorCode::TooManyConcurrentTasks => {
          return Err(SoraImageGenError::TooManyConcurrentTasks(error_response.error.message));
        }
        SoraErrorCode::Unknown(_) => {
          return Err(SoraImageGenError::GenericError(error_response.error.message));
        }
        SoraErrorCode::InvalidJwt => {
          return Err(SoraImageGenError::InvalidJwt(error_response.error.message));
        }
        SoraErrorCode::UsernameRequired => {
          return Err(SoraImageGenError::UsernameRequired(error_response.error.message));
        }
      }
    }

    return Err(SoraImageGenError::GenericError(error_response.error.message));
  }

  let response = serde_json::from_str(response_body)
      .map_err(|e| SoraImageGenError::GenericError(format!("Failed to parse success response: {}", e)))?;

  Ok(response)
}

#[cfg(test)]
mod tests {
  use crate::requests::image_gen::image_gen_http_request::RawSoraResponse;
  use errors::AnyhowResult;

  #[test]
  fn deserialize_task_id() -> AnyhowResult<()> {
    let json = "{\"id\": \"task_foobarbaz\"}";
    let response : RawSoraResponse = serde_json::from_str(json)?;
    assert_eq!(response.id.0, "task_foobarbaz");
    Ok(())
  }
}
