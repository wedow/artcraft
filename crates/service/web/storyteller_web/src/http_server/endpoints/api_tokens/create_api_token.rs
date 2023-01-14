use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use database_queries::queries::api_tokens::create_api_token::create_api_token_for_user;
use database_queries::tokens::Tokens;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn, log};
use regex::Regex;
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

// =============== Request ===============

#[derive(Deserialize)]
pub struct CreateApiTokenRequest {
  pub idempotency_token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct CreateApiTokenResponse {
  pub success: bool,
  pub api_token: String,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum CreateApiTokenError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for CreateApiTokenError {
  fn status_code(&self) -> StatusCode {
    match *self {
      CreateApiTokenError::BadInput(_) => StatusCode::BAD_REQUEST,
      CreateApiTokenError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CreateApiTokenError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for CreateApiTokenError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn create_api_token_handler(
  http_request: HttpRequest,
  request: web::Json<CreateApiTokenRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CreateApiTokenError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CreateApiTokenError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CreateApiTokenError::NotAuthorized);
    }
  };
  
  if user_session.is_banned {
    warn!("banned users cannot create API tokens");
    return Err(CreateApiTokenError::NotAuthorized);
  }

  let creator_ip_address = get_request_ip(&http_request);

  let api_token = create_api_token_for_user(
    &user_session.user_token,
    &request.idempotency_token,
    &creator_ip_address,
    &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("API token creation errror: {:?}", e);
        CreateApiTokenError::ServerError
      })?;

  let response = CreateApiTokenResponse {
    success: true,
    api_token
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| CreateApiTokenError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
