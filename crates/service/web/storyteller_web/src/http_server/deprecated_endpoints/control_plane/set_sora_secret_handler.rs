use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Form, Json};
use actix_web::{web, HttpRequest, HttpResponse};
use log::error;
use r2d2_redis::redis::Commands;
use utoipa::ToSchema;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use shared_service_components::sora_redis_credentials::get_sora_credentials_from_redis::get_sora_credentials_from_redis;
use shared_service_components::sora_redis_credentials::keys::RedisSoraCredentialSubkey;
use shared_service_components::sora_redis_credentials::set_sora_credential_field_in_redis::set_sora_credential_field_in_redis;

use crate::state::server_state::ServerState;

#[derive(Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum SetSoraSecretType {
  Bearer,
  Cookie,
  Sentinel
}

#[derive(Deserialize, ToSchema)]
pub struct SetSoraSecretRequest {
  pub key: SetSoraSecretType,
  pub value: String,
}

#[derive(Serialize, ToSchema)]
pub struct SetSoraSecretSuccessResponse {
  pub success: bool,
  pub bearer: String,
  pub cookie: String,
  pub sentinel: String,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum SetSoraSecretError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for SetSoraSecretError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SetSoraSecretError::BadInput(_) => StatusCode::BAD_REQUEST,
      SetSoraSecretError::NotAuthorized => StatusCode::UNAUTHORIZED,
      SetSoraSecretError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for SetSoraSecretError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

/// Set a Sora secret
#[utoipa::path(
  post,
  tag = "Control Plane",
  path = "/v1/control_plane/sora_secret",
  responses(
        (status = 200, description = "Success", body = SetSoraSecretSuccessResponse),
        (status = 400, description = "Bad input", body = SetSoraSecretError),
        (status = 401, description = "Not authorized", body = SetSoraSecretError),
        (status = 500, description = "Server error", body = SetSoraSecretError),
  ),
  params(
        ("request" = SetSoraSecretRequest, description = "Payload for Request"),
        ("path" = MediaFileTokenPathInfo, description = "Path for Request")
  )
)]
pub async fn set_sora_secret_handler(
  http_request: HttpRequest,
  request: Form<SetSoraSecretRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<SetSoraSecretSuccessResponse>, SetSoraSecretError> {

  // TODO(bt,2025-04-03): Some form of authentication should be required for this endpoint.
  let value = request.value.trim().to_string();

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        error!("redis error: {:?}", e);
        SetSoraSecretError::ServerError
      })?;

  set_sora_credential_field_in_redis(
    &mut redis,
    match request.key {
      SetSoraSecretType::Bearer => RedisSoraCredentialSubkey::Bearer,
      SetSoraSecretType::Cookie => RedisSoraCredentialSubkey::Cookie,
      SetSoraSecretType::Sentinel => RedisSoraCredentialSubkey::Sentinel,
    },
    &value
  ).map_err(|e| {
    error!("redis error: {:?}", e);
    SetSoraSecretError::ServerError
  })?;

  let credentials = get_sora_credentials_from_redis(&mut redis)
      .map_err(|e| {
        error!("redis error: {:?}", e);
        SetSoraSecretError::ServerError
      })?;

  // TODO(bt,2025-04-03): Probably not smart to return, but useful for debugging.
  Ok(Json(SetSoraSecretSuccessResponse {
    success: true,
    cookie: credentials.cookies.as_str().to_string(),
    bearer: credentials.jwt_bearer_token
        .as_ref()
        .map(|b| b.as_str().to_string())
        .unwrap_or_else(|| "".to_string()),
    sentinel: credentials.sora_sentinel
        .as_ref()
        .map(|s| s.as_str().to_string())
        .unwrap_or_else(|| "".to_string()),
  }))
}
