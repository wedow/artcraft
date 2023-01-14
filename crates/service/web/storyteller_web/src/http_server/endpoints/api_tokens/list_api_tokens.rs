use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use chrono::{DateTime, Utc};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use database_queries::queries::api_tokens::list_available_api_tokens_for_user::list_available_api_tokens_for_user;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use lexical_sort::natural_lexical_cmp;
use log::{info, warn, log};
use regex::Regex;
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

// =============== Success Response ===============

#[derive(Serialize)]
pub struct ListApiTokensResponse {
  pub success: bool,
  pub api_tokens: Vec<ApiToken>,
}

/// Public-facing and optimized (non-irrelevant fields)
#[derive(Serialize)]
pub struct ApiToken {
  pub api_token: String,
  pub maybe_short_description: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum ListApiTokensError {
  NotAuthorized,
  ServerError,
}

impl ResponseError for ListApiTokensError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListApiTokensError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListApiTokensError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListApiTokensError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn list_api_tokens_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, ListApiTokensError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListApiTokensError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(ListApiTokensError::NotAuthorized);
    }
  };

  if user_session.is_banned {
    warn!("banned users cannot use API tokens");
    return Err(ListApiTokensError::NotAuthorized);
  }

  let api_tokens = list_available_api_tokens_for_user(&user_session.user_token, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("API token query error: {:?}", e);
        ListApiTokensError::ServerError
      })?;

  let mut api_tokens = api_tokens.into_iter()
      .map(|r| {
        ApiToken {
          api_token: r.api_token,
          maybe_short_description: r.maybe_short_description,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }
      })
      .collect::<Vec<ApiToken>>();

  let response = ListApiTokensResponse {
    success: true,
    api_tokens,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListApiTokensError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
