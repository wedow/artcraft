use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::Path;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use crate::validations::model_uploads::validate_model_title;
use derive_more::{Display, Error};
use log::{info, warn, log};
use regex::Regex;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::sync::Arc;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteIpBanPathInfo {
  ip_address: String,
}

#[derive(Deserialize)]
pub struct DeleteIpBanRequest {
  delete: bool,
}

#[derive(Debug, Display)]
pub enum DeleteIpBanError {
  BadInput(String),
  ServerError,
  Unauthorized,
}

impl ResponseError for DeleteIpBanError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteIpBanError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteIpBanError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      DeleteIpBanError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      DeleteIpBanError::BadInput(reason) => reason.to_string(),
      DeleteIpBanError::ServerError => "server error".to_string(),
      DeleteIpBanError::Unauthorized => "unauthorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

pub async fn delete_ip_ban_handler(
  http_request: HttpRequest,
  path: Path<DeleteIpBanPathInfo>,
  request: web::Json<DeleteIpBanRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteIpBanError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteIpBanError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(DeleteIpBanError::Unauthorized);
    }
  };

  if !user_session.can_ban_users {
    warn!("user is not allowed to delete bans: {}", user_session.user_token);
    return Err(DeleteIpBanError::Unauthorized);
  }

  let query_result = if request.delete {
    info!("Deleting IP ban: {}", &path.ip_address);

    sqlx::query!(
        r#"
UPDATE
    ip_address_bans
SET
    mod_user_token = ?,
    deleted_at = CURRENT_TIMESTAMP
WHERE
    ip_address = ?
LIMIT 1
        "#,
      &user_session.user_token,
      &path.ip_address,
    )
        .execute(&server_state.mysql_pool)
        .await
  } else {
    info!("Restoring IP ban: {}", &path.ip_address);

    sqlx::query!(
        r#"
UPDATE
    ip_address_bans
SET
    mod_user_token = ?,
    deleted_at = NULL
WHERE
    ip_address = ?
LIMIT 1
        "#,
      &user_session.user_token,
      &path.ip_address,
    )
        .execute(&server_state.mysql_pool)
        .await
  };

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("(un)delete IP ban DB error: {:?}", err);
      return Err(DeleteIpBanError::ServerError);
    }
  };

  Ok(simple_json_success())
}
