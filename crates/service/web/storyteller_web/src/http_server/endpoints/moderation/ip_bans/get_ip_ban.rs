use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::Path;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use chrono::{DateTime, Utc};
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
pub struct GetIpBanPathInfo {
  ip_address: String,
}

#[derive(Serialize)]
pub struct GetIpBanResponse {
  pub success: bool,
  pub ip_address_ban: IpBanRecord,
}

#[derive(Serialize)]
pub struct IpBanRecord {
  pub ip_address: String,
  pub maybe_target_user_token: Option<String>,
  pub maybe_target_username: Option<String>,
  pub mod_user_token: String,
  pub mod_username: String,
  pub mod_display_name: String,
  pub mod_notes: String,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Display)]
pub enum GetIpBanError {
  BadInput(String),
  ServerError,
  NotFound,
  Unauthorized,
}

impl ResponseError for GetIpBanError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetIpBanError::BadInput(_) => StatusCode::BAD_REQUEST,
      GetIpBanError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetIpBanError::NotFound => StatusCode::NOT_FOUND,
      GetIpBanError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetIpBanError::BadInput(reason) => reason.to_string(),
      GetIpBanError::ServerError => "server error".to_string(),
      GetIpBanError::NotFound => "not found".to_string(),
      GetIpBanError::Unauthorized => "unauthorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

pub async fn get_ip_ban_handler(
  http_request: HttpRequest,
  path: Path<GetIpBanPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetIpBanError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetIpBanError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(GetIpBanError::Unauthorized);
    }
  };

  if !user_session.can_ban_users {
    warn!("user is not allowed to view bans: {}", user_session.user_token);
    return Err(GetIpBanError::Unauthorized);
  }

  let ip_address = path.ip_address.trim();

  // NB: Lookup failure is Err(RowNotFound).
  let maybe_result = sqlx::query_as!(
      IpBanRecord,
        r#"
SELECT
    ip_bans.ip_address,

    ip_bans.maybe_target_user_token,
    banned_users.username as maybe_target_username,

    ip_bans.mod_user_token,
    mod_users.username as mod_username,
    mod_users.display_name as mod_display_name,

    ip_bans.mod_notes,
    ip_bans.created_at,
    ip_bans.updated_at
FROM
    ip_address_bans AS ip_bans
LEFT OUTER JOIN users as banned_users
    ON ip_bans.maybe_target_user_token = banned_users.token
JOIN users as mod_users
    ON ip_bans.mod_user_token = mod_users.token
WHERE
    ip_bans.ip_address = ?
LIMIT 1
        "#,
      ip_address
    )
      .fetch_one(&server_state.mysql_pool)
      .await;

  let result : IpBanRecord = match maybe_result {
    Ok(result) => {
      result
    },
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          return Err(GetIpBanError::NotFound);
        },
        _ => {
          warn!("get ip ban db error: {:?}", err);
          return Err(GetIpBanError::ServerError);
        }
      }
    }
  };

  let response = GetIpBanResponse {
    success: true,
    ip_address_ban: result,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetIpBanError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
