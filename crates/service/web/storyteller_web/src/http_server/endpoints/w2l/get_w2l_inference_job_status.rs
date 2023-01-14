use actix_http::Error;
use actix_web::http::header;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest, HttpMessage};
use chrono::{DateTime, Utc};
use crate::AnyhowResult;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;
use log::{info, warn, log};
use r2d2_redis::redis::Commands;
use redis_common::redis_keys::RedisKeys;
use regex::Regex;
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetW2lInferenceStatusPathInfo {
  token: String,
}

#[derive(Serialize)]
pub struct W2lInferenceJobStatusForResponse {
  pub job_token: String,

  /// Primary status from the database (a state machine).
  pub status: String,

  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  pub attempt_count: u8,
  pub maybe_result_token: Option<String>,
  pub maybe_public_bucket_video_path: Option<String>,

  pub maybe_w2l_template_token: Option<String>,
  pub w2l_template_type: String,
  pub title: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct GetW2lInferenceStatusSuccessResponse {
  pub success: bool,
  pub state: W2lInferenceJobStatusForResponse,
}

#[derive(Debug)]
pub enum GetW2lInferenceStatusError {
  ServerError,
}

#[derive(Serialize)]
pub struct W2lInferenceJobStatusRecord {
  pub job_token: String,

  pub status: String,
  pub attempt_count: i32,
  pub maybe_result_token: Option<String>,
  pub maybe_public_bucket_video_path: Option<String>,

  pub maybe_w2l_template_token: Option<String>,
  pub w2l_template_type: String,

  pub title: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl ResponseError for GetW2lInferenceStatusError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetW2lInferenceStatusError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetW2lInferenceStatusError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetW2lInferenceStatusError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_w2l_inference_job_status_handler(
  http_request: HttpRequest,
  path: Path<GetW2lInferenceStatusPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetW2lInferenceStatusError>
{
  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_status = sqlx::query_as!(
      W2lInferenceJobStatusRecord,
        r#"
SELECT
    jobs.token as job_token,

    jobs.status,
    jobs.attempt_count,
    jobs.on_success_result_token as maybe_result_token,
    results.public_bucket_video_path as maybe_public_bucket_video_path,

    jobs.maybe_w2l_template_token,
    w2l.template_type as w2l_template_type,
    w2l.title,

    jobs.created_at,
    jobs.updated_at

FROM w2l_inference_jobs as jobs
JOIN w2l_templates as w2l
    ON w2l.token = jobs.maybe_w2l_template_token
LEFT OUTER JOIN w2l_results as results
    ON jobs.on_success_result_token = results.token

WHERE jobs.token = ?
        "#,
      &path.token
    )
      .fetch_one(&server_state.mysql_pool)
      .await; // TODO: This will return error if it doesn't exist

  let record : W2lInferenceJobStatusRecord = match maybe_status {
    Ok(record) => record,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          return Err(GetW2lInferenceStatusError::ServerError);
        },
        _ => {
          warn!("w2l template query error: {:?}", err);
          return Err(GetW2lInferenceStatusError::ServerError);
        }
      }
    }
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        GetW2lInferenceStatusError::ServerError
      })?;

  let extra_status_key = RedisKeys::w2l_inference_extra_status_info(&path.token);
  let maybe_extra_status_description : Option<String> = match redis.get(&extra_status_key) {
    Ok(Some(status)) => {
      Some(status)
    },
    Ok(None) => None,
    Err(e) => {
      warn!("redis error: {:?}", e);
      None // Fail open
    },
  };

  let template_for_response = W2lInferenceJobStatusForResponse {
    job_token: record.job_token.clone(),
    status: record.status.clone(),
    maybe_extra_status_description,
    attempt_count: record.attempt_count as u8,
    maybe_result_token: record.maybe_result_token.clone(),
    maybe_public_bucket_video_path: record.maybe_public_bucket_video_path.clone(),
    maybe_w2l_template_token: record.maybe_w2l_template_token.clone(),
    w2l_template_type: record.w2l_template_type.clone(),
    title: record.title.clone(),
    created_at: record.created_at.clone(),
    updated_at: record.updated_at.clone(),
  };

  let response = GetW2lInferenceStatusSuccessResponse {
    success: true,
    state: template_for_response,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetW2lInferenceStatusError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
