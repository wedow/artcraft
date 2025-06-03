use std::fmt;
use std::sync::Arc;

use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use utoipa::ToSchema;

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum FalWebhookError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for FalWebhookError {
  fn status_code(&self) -> StatusCode {
    match *self {
      FalWebhookError::BadInput(_) => StatusCode::BAD_REQUEST,
      FalWebhookError::NotFound => StatusCode::NOT_FOUND,
      FalWebhookError::NotAuthorized => StatusCode::UNAUTHORIZED,
      FalWebhookError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for FalWebhookError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

/// Fal webhook
#[utoipa::path(
  post,
  tag = "Webooks",
  path = "/v1/webhooks/fal",
  responses(
    (status = 200, description = "Success", body = SimpleGenericJsonSuccess),
    (status = 400, description = "Bad input", body = FalWebhookError),
    (status = 401, description = "Not authorized", body = FalWebhookError),
    (status = 500, description = "Server error", body = FalWebhookError),
  ),
  params(
    ("request" = RemoveImageBackgroundRequest, description = "Payload for Request"),
  )
)]
pub async fn fal_webhook_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  request_body: web::Bytes
) -> Result<Json<SimpleGenericJsonSuccess>, FalWebhookError> {
  
  let body = String::from_utf8(request_body.to_vec())
    .map_err(|e| FalWebhookError::BadInput(format!("Invalid UTF-8 in request body: {}", e)))?;
  
  println!("Received Fal webhook with body: {}", body);
  
  Ok(SimpleGenericJsonSuccess::wrapped(true))
}
