use actix_http::Error;
use actix_web::http::header;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use database_queries::queries::twitch::twitch_event_rules::delete_twitch_event_rule::delete_twitch_event_rule;
use database_queries::queries::twitch::twitch_event_rules::get_twitch_event_rule_for_user::get_twitch_event_rule_for_user;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn, log, error};
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

// =============== Request ===============

#[derive(Deserialize)]
pub struct DeleteTwitchEventRulePathInfo {
  token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct DeleteTwitchEventRuleResponse {
  pub success: bool,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum DeleteTwitchEventRuleError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for DeleteTwitchEventRuleError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteTwitchEventRuleError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteTwitchEventRuleError::NotFound => StatusCode::NOT_FOUND,
      DeleteTwitchEventRuleError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteTwitchEventRuleError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DeleteTwitchEventRuleError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn delete_twitch_event_rule_handler(
  http_request: HttpRequest,
  path: Path<DeleteTwitchEventRulePathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, DeleteTwitchEventRuleError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteTwitchEventRuleError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(DeleteTwitchEventRuleError::NotAuthorized);
    }
  };

  if user_session.is_banned {
    warn!("banned users cannot delete");
    return Err(DeleteTwitchEventRuleError::NotAuthorized);
  }

  let twitch_event_rule = get_twitch_event_rule_for_user(
    &path.token, &user_session.user_token, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        error!("Error with query: {:?}", e);
        return DeleteTwitchEventRuleError::ServerError;
      })?;

  if twitch_event_rule.is_none() {
    info!("event rule not found");
    return Err(DeleteTwitchEventRuleError::NotFound);
  }

  let creator_ip_address = get_request_ip(&http_request);

  let _r = delete_twitch_event_rule(
    &path.token,
    &creator_ip_address,
    &server_state.mysql_pool)
      .await
      .map_err(|e| {
        error!("Error with query: {:?}", e);
        return DeleteTwitchEventRuleError::ServerError;
      });

  let response = DeleteTwitchEventRuleResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| DeleteTwitchEventRuleError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
