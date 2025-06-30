use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use derive_more::Display;
use log::{error, warn};

use mysql_queries::queries::ip_bans::get_ip_ban::get_ip_ban;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

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
    warn!("user is not allowed to view bans: {:?}", user_session.user_token);
    return Err(GetIpBanError::Unauthorized);
  }

  let ip_address = path.ip_address.trim();

  let maybe_result = get_ip_ban(ip_address, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("get ip ban db error: {:?}", err);
        GetIpBanError::ServerError
      })?;

  let result : IpBanRecord = match maybe_result {
    None => {
      return Err(GetIpBanError::NotFound);
    },
    Some(ban) => IpBanRecord {
      ip_address: ban.ip_address,
      maybe_target_user_token: ban.maybe_target_user_token,
      maybe_target_username: ban.maybe_target_username,
      mod_user_token: ban.mod_user_token,
      mod_username: ban.mod_username,
      mod_display_name: ban.mod_display_name,
      mod_notes: ban.mod_notes,
      created_at: ban.created_at,
      updated_at: ban.updated_at,
    },
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
