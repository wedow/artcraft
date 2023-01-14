use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::Path;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest, HttpMessage};
use chrono::{DateTime, Utc};
use crate::AnyhowResult;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;
use derive_more::{Display, Error};
use log::{info, warn, log};
use r2d2_redis::redis::{Commands, RedisError};
use redis_common::redis_keys::RedisKeys;
use regex::Regex;
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::sync::Arc;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetTtsModelUseCountPathInfo {
  model_token: String,
}

#[derive(Serialize)]
pub struct GetTtsModelUseCountSuccessResponse {
  pub success: bool,
  pub count: Option<u64>,
}

#[derive(Debug, Display)]
pub enum GetTtsModelUseCountError {
  ServerError,
  NotFoundError,
}

impl ResponseError for GetTtsModelUseCountError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetTtsModelUseCountError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
      GetTtsModelUseCountError::NotFoundError => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetTtsModelUseCountError::ServerError => "server error".to_string(),
      GetTtsModelUseCountError::NotFoundError => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

pub async fn get_tts_model_use_count_handler(
  http_request: HttpRequest,
  path: Path<GetTtsModelUseCountPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetTtsModelUseCountError>
{
  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        GetTtsModelUseCountError::ServerError
      })?;

  let redis_count_key = RedisKeys::tts_model_usage_count(&path.model_token);

  let count : Option<u64> = redis.get(&redis_count_key)
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        GetTtsModelUseCountError::ServerError
      })?;

  let response = GetTtsModelUseCountSuccessResponse {
    success: true,
    count,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetTtsModelUseCountError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
