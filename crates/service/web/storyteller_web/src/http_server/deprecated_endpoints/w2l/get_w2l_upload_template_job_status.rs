use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use derive_more::Display;
use log::warn;
use redis::Commands;

use mysql_queries::queries::w2l::w2l_template_upload_jobs::get_w2l_template_upload_job_status::get_w2l_template_upload_job_status;
use redis_common::redis_keys::RedisKeys;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetW2lUploadTemplateStatusPathInfo {
  token: String,
}

#[derive(Serialize)]
pub struct W2lUploadTemplateJobStatusForResponse {
  pub job_token: String,

  /// Primary status from the database (a state machine).
  pub status: String,

  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  /// If the job failed or permanently died, we might have a reason.
  pub maybe_failure_reason: Option<String>,

  pub attempt_count: u8,
  pub maybe_template_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct GetW2lUploadTemplateStatusSuccessResponse {
  pub success: bool,
  pub state: W2lUploadTemplateJobStatusForResponse,
}

#[derive(Debug, Display)]
pub enum GetW2lUploadTemplateStatusError {
  ServerError,
}

#[derive(Serialize)]
pub struct W2lUploadTemplateJobStatusRecord {
  pub job_token: String,

  pub status: String,
  pub attempt_count: i32,
  pub maybe_template_token: Option<String>,

  pub maybe_failure_reason: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl ResponseError for GetW2lUploadTemplateStatusError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetW2lUploadTemplateStatusError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetW2lUploadTemplateStatusError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

pub async fn get_w2l_upload_template_job_status_handler(
  http_request: HttpRequest,
  path: Path<GetW2lUploadTemplateStatusPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetW2lUploadTemplateStatusError>
{
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let record = get_w2l_template_upload_job_status(&path.token, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("database error: {:?}", e);
        GetW2lUploadTemplateStatusError::ServerError
      })?
      .ok_or_else(|| {
        warn!("no w2l template upload job found with token: {}", &path.token);
        GetW2lUploadTemplateStatusError::ServerError
      })?;

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        GetW2lUploadTemplateStatusError::ServerError
      })?;

  let extra_status_key = RedisKeys::w2l_download_extra_status_info(&path.token);
  let maybe_extra_status_description : Option<String> = match redis.get(&extra_status_key) {
    Ok(Some(status)) => Some(status),
    Ok(None) => None,
    Err(e) => {
      warn!("redis error: {:?}", e);
      None // Fail open
    },
  };

  let template_for_response = W2lUploadTemplateJobStatusForResponse {
    job_token: record.job_token.clone(),
    status: record.status.clone(),
    maybe_extra_status_description,
    maybe_failure_reason: record.maybe_failure_reason.clone(),
    attempt_count: record.attempt_count as u8,
    maybe_template_token: record.maybe_template_token.clone(),
    created_at: record.created_at,
    updated_at: record.updated_at,
  };

  let response = GetW2lUploadTemplateStatusSuccessResponse {
    success: true,
    state: template_for_response,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetW2lUploadTemplateStatusError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
