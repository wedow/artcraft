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
pub struct GetTtsUploadModelStatusPathInfo {
  token: String,
}

#[derive(Serialize)]
pub struct TtsUploadModelJobStatusForResponse {
  pub job_token: String,

  /// Primary status from the database (a state machine).
  pub status: String,

  // TODO: Not yet used.
  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  pub attempt_count: u8,
  pub maybe_model_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct GetTtsUploadModelStatusSuccessResponse {
  pub success: bool,
  pub state: TtsUploadModelJobStatusForResponse,
}

#[derive(Debug, Display)]
pub enum GetTtsUploadModelStatusError {
  ServerError,
}

#[derive(Serialize)]
pub struct TtsUploadModelJobStatusRecord {
  pub job_token: String,

  pub status: String,
  pub attempt_count: i32,
  pub maybe_model_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl ResponseError for GetTtsUploadModelStatusError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetTtsUploadModelStatusError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetTtsUploadModelStatusError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

pub async fn get_tts_upload_model_job_status_handler(
  http_request: HttpRequest,
  path: Path<GetTtsUploadModelStatusPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetTtsUploadModelStatusError>
{
  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_status = sqlx::query_as!(
      TtsUploadModelJobStatusRecord,
        r#"
SELECT
    jobs.token as job_token,

    jobs.status,
    jobs.attempt_count,
    jobs.on_success_result_token as maybe_model_token,

    jobs.created_at,
    jobs.updated_at

FROM tts_model_upload_jobs as jobs

WHERE jobs.token = ?
        "#,
      &path.token
    )
      .fetch_one(&server_state.mysql_pool)
      .await; // TODO: This will return error if it doesn't exist

  let record : TtsUploadModelJobStatusRecord = match maybe_status {
    Ok(record) => record,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          return Err(GetTtsUploadModelStatusError::ServerError);
        },
        _ => {
          warn!("tts template query error: {:?}", err);
          return Err(GetTtsUploadModelStatusError::ServerError);
        }
      }
    }
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        GetTtsUploadModelStatusError::ServerError
      })?;

  let extra_status_key = RedisKeys::tts_download_extra_status_info(&path.token);
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

  let model_for_response = TtsUploadModelJobStatusForResponse {
    job_token: record.job_token.clone(),
    status: record.status.clone(),
    maybe_extra_status_description,
    attempt_count: record.attempt_count as u8,
    maybe_model_token: record.maybe_model_token.clone(),
    created_at: record.created_at.clone(),
    updated_at: record.updated_at.clone(),
  };

  let response = GetTtsUploadModelStatusSuccessResponse {
    success: true,
    state: model_for_response,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetTtsUploadModelStatusError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
