use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{info, warn};

use mysql_queries::queries::ip_bans::upsert_ip_ban::{upsert_ip_ban, UpsertIpBanArgs};
use user_input_common::validate_user_provided_ip_address::validate_user_provided_ip_address;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

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
    warn!("user is not allowed to add bans: {:?}", user_session.user_token);
    return Err(AddIpBanError::Unauthorized);
  }

  let ip_address = request.ip_address.trim();

  if let Err(e) = validate_user_provided_ip_address(&ip_address) {
    warn!("Bad ip address: {}", e);
    return Err(AddIpBanError::BadInput(e.to_string()));
  }

  info!("Creating ban...");

  upsert_ip_ban(UpsertIpBanArgs {
    ip_address,
    maybe_target_user_token: request.maybe_target_user_token.as_deref(),
    mod_user_token: user_session.user_token.as_str(),
    mod_notes: &request.mod_notes,
    mysql_pool: &server_state.mysql_pool,
  }).await
      .map_err(|err| {
        warn!("Add IP ban DB error: {:?}", err);
        AddIpBanError::ServerError
      })?;

  Ok(simple_json_success())
}
