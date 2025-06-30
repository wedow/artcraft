use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use mysql_queries::queries::users::user::update::set_user_ban_status::{set_user_ban_status, SetUserBanStatsArgs};
use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username;

use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct BanUserRequest {
  pub username: String,
  pub mod_notes: String,
  pub is_banned: bool,
}

#[derive(Serialize)]
pub struct BanUserSuccessResponse {
  pub success: bool,
}

#[derive(Serialize, Debug)]
pub struct BanUserErrorResponse {
  pub success: bool,
  pub error_type: BanUserErrorType,
  pub error_message: String,
}

#[derive(Copy, Clone, Debug, Serialize)]
pub enum BanUserErrorType {
  ServerError,
  Unauthorized,
  UserNotFound,
}

impl BanUserErrorResponse {
  fn unauthorized() -> Self {
    Self {
      success: false,
      error_type: BanUserErrorType::Unauthorized,
      error_message: "unauthorized".to_string()
    }
  }
  fn server_error() -> Self {
    Self {
      success: false,
      error_type: BanUserErrorType::ServerError,
      error_message: "server error".to_string()
    }
  }
  fn not_found() -> Self {
    Self {
      success: false,
      error_type: BanUserErrorType::UserNotFound,
      error_message: "user not found".to_string()
    }
  }
}

impl ResponseError for BanUserErrorResponse {
  fn status_code(&self) -> StatusCode {
    match self.error_type {
      BanUserErrorType::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      BanUserErrorType::Unauthorized => StatusCode::UNAUTHORIZED,
      BanUserErrorType::UserNotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for BanUserErrorResponse {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self.error_type)
  }
}

pub async fn ban_user_handler(
  http_request: HttpRequest,
  request: web::Json<BanUserRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, BanUserErrorResponse> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        BanUserErrorResponse::server_error()
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(BanUserErrorResponse::unauthorized());
    }
  };

  if !user_session.can_ban_users {
    warn!("user is not allowed to add bans: {:?}", user_session.user_token);
    return Err(BanUserErrorResponse::unauthorized());
  }

  let username_lower = request.username.to_lowercase();

  let user_lookup_result = get_user_profile_by_username(
    &username_lower, &server_state.mysql_pool).await;

  let user_profile = match user_lookup_result {
    Ok(Some(result)) => result,
    Ok(None) => return Err(BanUserErrorResponse::not_found()),
    Err(err) => {
      warn!("lookup error: {:?}", err);
      return Err(BanUserErrorResponse::server_error());
    }
  };

  set_user_ban_status(SetUserBanStatsArgs {
    subject_user_token: &user_profile.user_token,
    is_banned: request.is_banned,
    mod_user_token: &user_session.user_token,
    maybe_mod_comments: Some(&request.mod_notes),
    mysql_pool: &server_state.mysql_pool,
  }).await
      .map_err(|err| {
        warn!("Add IP ban DB error: {:?}", err);
        BanUserErrorResponse::server_error()
      })?;

  Ok(simple_json_success())
}
