use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use crate::validations::model_uploads::validate_model_title;
use log::{info, warn, log};
use regex::Regex;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;
use user_input_common::validate_user_provided_ip_address::validate_user_provided_ip_address;

#[derive(Deserialize)]
pub struct AddIpBanRequest {
  ip_address: String,
  mod_notes: String,
  maybe_target_user_token: Option<String>,
}

#[derive(Debug)]
pub enum AddIpBanError {
  BadInput(String),
  ServerError,
  Unauthorized,
}

impl ResponseError for AddIpBanError {
  fn status_code(&self) -> StatusCode {
    match *self {
      AddIpBanError::BadInput(_) => StatusCode::BAD_REQUEST,
      AddIpBanError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      AddIpBanError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      AddIpBanError::BadInput(reason) => reason.to_string(),
      AddIpBanError::ServerError => "server error".to_string(),
      AddIpBanError::Unauthorized => "unauthorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for AddIpBanError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn add_ip_ban_handler(
  http_request: HttpRequest,
  request: web::Json<AddIpBanRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, AddIpBanError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        AddIpBanError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(AddIpBanError::Unauthorized);
    }
  };

  if !user_session.can_ban_users {
    warn!("user is not allowed to add bans: {}", user_session.user_token);
    return Err(AddIpBanError::Unauthorized);
  }

  let ip_address = request.ip_address.trim();

  if let Err(e) = validate_user_provided_ip_address(&ip_address) {
    warn!("Bad ip address: {}", e);
    return Err(AddIpBanError::BadInput(e.to_string()));
  }

  info!("Creating ban...");

  let query_result = sqlx::query!(
        r#"
INSERT INTO
    ip_address_bans
SET
    ip_address = ?,
    maybe_target_user_token = ?,
    mod_user_token = ?,
    mod_notes = ?
ON DUPLICATE KEY UPDATE
    expires_at = NULL,
    deleted_at = NULL,
    ip_address = ?,
    maybe_target_user_token = ?,
    mod_user_token = ?,
    mod_notes = ?
        "#,
      // Insert
      &request.ip_address,
      &request.maybe_target_user_token,
      &user_session.user_token,
      &request.mod_notes,
      // Update
      &ip_address,
      &request.maybe_target_user_token,
      &user_session.user_token,
      &request.mod_notes,
    )
      .execute(&server_state.mysql_pool)
      .await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Add IP ban DB error: {:?}", err);
      return Err(AddIpBanError::ServerError);
    }
  };

  Ok(simple_json_success())
}
