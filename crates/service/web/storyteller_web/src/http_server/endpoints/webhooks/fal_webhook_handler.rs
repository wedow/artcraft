use std::fmt;
use std::sync::Arc;

use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use log::info;
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use serde_json::Value;
use utoipa::ToSchema;

#[derive(Debug, Deserialize, ToSchema)]
pub struct FalWebhookRequest {
  pub status: FalWebhookStatus,
  
  pub request_id: Option<String>,
  pub gateway_request_id: Option<String>,

  pub error: Option<String>,
  
  /// Payload of the webhook, if any.
  pub payload: Option<Value>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub enum FalWebhookStatus {
  #[serde(alias = "OK")]
  Ok,
  #[serde(alias = "ERROR")]
  Error
}

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
    ("request" = FalWebhookRequest, description = "Payload for Request"),
  )
)]
pub async fn fal_webhook_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  //request_body: web::Bytes
  request: Json<FalWebhookRequest>,
) -> Result<Json<SimpleGenericJsonSuccess>, FalWebhookError> {


  info!("Received FAL webhook body: {:?}", request);


  Ok(SimpleGenericJsonSuccess::wrapped(true))
}
