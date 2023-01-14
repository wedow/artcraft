use actix_http::Error;
use actix_web::http::header;
use actix_web::cookie::Cookie;
use actix_web::HttpResponseBuilder;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest, HttpMessage};
use chrono::{DateTime, Utc};
use crate::AnyhowResult;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;
use derive_more::{Display, Error};
use log::{info, warn, log};
use r2d2_redis::redis::Commands;
use redis_common::redis_keys::RedisKeys;
use regex::Regex;
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::sync::Arc;

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
  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_status = sqlx::query_as!(
      W2lUploadTemplateJobStatusRecord,
        r#"
SELECT
    jobs.token as job_token,

    jobs.status,
    jobs.attempt_count,
    jobs.on_success_result_token as maybe_template_token,

    jobs.failure_reason as maybe_failure_reason,

    jobs.created_at,
    jobs.updated_at

FROM w2l_template_upload_jobs as jobs

WHERE jobs.token = ?
        "#,
      &path.token
    )
      .fetch_one(&server_state.mysql_pool)
      .await; // TODO: This will return error if it doesn't exist

  let record : W2lUploadTemplateJobStatusRecord = match maybe_status {
    Ok(record) => record,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          return Err(GetW2lUploadTemplateStatusError::ServerError);
        },
        _ => {
          warn!("w2l template query error: {:?}", err);
          return Err(GetW2lUploadTemplateStatusError::ServerError);
        }
      }
    }
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        GetW2lUploadTemplateStatusError::ServerError
      })?;

  let extra_status_key = RedisKeys::w2l_download_extra_status_info(&path.token);
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

  let template_for_response = W2lUploadTemplateJobStatusForResponse {
    job_token: record.job_token.clone(),
    status: record.status.clone(),
    maybe_extra_status_description,
    maybe_failure_reason: record.maybe_failure_reason.clone(),
    attempt_count: record.attempt_count as u8,
    maybe_template_token: record.maybe_template_token.clone(),
    created_at: record.created_at.clone(),
    updated_at: record.updated_at.clone(),
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
