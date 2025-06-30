use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use derive_more::Display;
use log::warn;
use r2d2_redis::redis::Commands;

use redis_common::redis_keys::RedisKeys;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetW2lTemplateUseCountPathInfo {
  template_token: String,
}

#[derive(Serialize)]
pub struct GetW2lTemplateUseCountSuccessResponse {
  pub success: bool,
  pub count: Option<u64>,
}

#[derive(Debug, Display)]
pub enum GetW2lTemplateUseCountError {
  ServerError,
  NotFoundError,
}

impl ResponseError for GetW2lTemplateUseCountError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetW2lTemplateUseCountError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
      GetW2lTemplateUseCountError::NotFoundError => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetW2lTemplateUseCountError::ServerError => "server error".to_string(),
      GetW2lTemplateUseCountError::NotFoundError => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

pub async fn get_w2l_template_use_count_handler(
  http_request: HttpRequest,
  path: Path<GetW2lTemplateUseCountPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetW2lTemplateUseCountError>
{

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        GetW2lTemplateUseCountError::ServerError
      })?;

  let redis_count_key = RedisKeys::w2l_template_usage_count(&path.template_token);

  let count : Option<u64> = redis.get(&redis_count_key)
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        GetW2lTemplateUseCountError::ServerError
      })?;

  let response = GetW2lTemplateUseCountSuccessResponse {
    success: true,
    count,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetW2lTemplateUseCountError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
