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
use database_queries::queries::api_tokens::delete_api_token::delete_api_token;
use database_queries::queries::api_tokens::list_available_api_tokens_for_user::list_available_api_tokens_for_user;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn, log, error};
use regex::Regex;
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

// =============== Request ===============

// NB: `api_token` is only in PathInfo because we're deleting it.

#[derive(Deserialize)]
pub struct DeleteApiTokenPathInfo {
  api_token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct DeleteApiTokenResponse {
  pub success: bool,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum DeleteApiTokenError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for DeleteApiTokenError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteApiTokenError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteApiTokenError::NotFound => StatusCode::NOT_FOUND,
      DeleteApiTokenError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteApiTokenError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DeleteApiTokenError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn delete_api_token_handler(
  http_request: HttpRequest,
  path: Path<DeleteApiTokenPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, DeleteApiTokenError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteApiTokenError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(DeleteApiTokenError::NotAuthorized);
    }
  };

  if user_session.is_banned {
    warn!("banned users cannot edit API tokens");
    return Err(DeleteApiTokenError::NotAuthorized);
  }

  let tokens = list_available_api_tokens_for_user(&user_session.user_token,
    &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Error querying tokens: {:?}", e);
        return DeleteApiTokenError::ServerError;
      })?;

  let valid_token = tokens.iter()
      .find(|t| t.api_token.eq(&path.api_token))
      .is_some();

  if !valid_token {
    warn!("Invalid API Token");
    return Err(DeleteApiTokenError::NotFound);
  }

  let creator_ip_address = get_request_ip(&http_request);

  let _r = delete_api_token(
    &user_session.user_token,
    &path.api_token,
    &creator_ip_address,
    &server_state.mysql_pool)
      .await
      .map_err(|e| {
        error!("Error with query: {:?}", e);
        return DeleteApiTokenError::ServerError;
      });

  let response = DeleteApiTokenResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| DeleteApiTokenError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
