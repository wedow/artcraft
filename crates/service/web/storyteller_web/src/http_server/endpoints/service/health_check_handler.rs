use actix_http::Error;
use actix_web::http::header;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use chrono::{DateTime, Utc, NaiveDateTime};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use database_queries::complex_models::event_responses::EventResponse;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use lexical_sort::natural_lexical_cmp;
use log::{info, warn, log, error};
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

// =============== Success Response ===============

#[derive(Serialize)]
pub struct HealthCheckResponse {
  pub success: bool,
  pub is_healthy: bool,
  pub last_db_time: Option<NaiveDateTime>,
  pub healthy_check_consecutive_count: Option<u64>,
  pub unhealthy_check_consecutive_count: Option<u64>,
}


// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum HealthCheckError {
  ServerError,
}

impl ResponseError for HealthCheckError {
  fn status_code(&self) -> StatusCode {
    match *self {
      HealthCheckError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for HealthCheckError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn get_health_check_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, HealthCheckError>
{
  let health_check_status = server_state.health_check_status.get_health_check_status()
      .map_err(|e| {
        error!("Error serving health check status: {:?}", e);
        HealthCheckError::ServerError
      })?;

  let is_healthy = health_check_status.is_healthy;

  let response = HealthCheckResponse {
    success: true,
    is_healthy: health_check_status.is_healthy,
    last_db_time: health_check_status.last_db_time,
    healthy_check_consecutive_count: health_check_status.healthy_check_consecutive_count,
    unhealthy_check_consecutive_count: health_check_status.unhealthy_check_consecutive_count,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| HealthCheckError::ServerError)?;

  if is_healthy {
    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
  } else {
    Ok(HttpResponse::InternalServerError()
        .content_type("application/json")
        .body(body))
  }
}
