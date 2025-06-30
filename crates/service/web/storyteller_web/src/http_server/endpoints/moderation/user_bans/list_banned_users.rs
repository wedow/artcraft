use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::state::server_state::ServerState;

// TODO: Implement the endpoint
#[derive(Deserialize)]
pub struct ListBannedUsersRequest;

// TODO: Implement the endpoint
#[derive(Serialize)]
pub struct ListBannedUsersResponse;

#[derive(Serialize, Debug)]
pub struct ListBannedUsersErrorResponse {
  pub success: bool,
  pub error_type: ListBannedUsersErrorType,
  pub error_message: String,
}

#[derive(Copy, Clone, Debug, Serialize)]
pub enum ListBannedUsersErrorType {
  BadInput,
  ServerError,
  Unauthorized,
  UserNotFound,
}

impl ListBannedUsersErrorResponse {
  fn unauthorized() -> Self {
    Self {
      success: false,
      error_type: ListBannedUsersErrorType::Unauthorized,
      error_message: "unauthorized".to_string()
    }
  }
  fn server_error() -> Self {
    Self {
      success: false,
      error_type: ListBannedUsersErrorType::ServerError,
      error_message: "server error".to_string()
    }
  }
  fn bad_request(error_message: &str) -> Self {
    Self {
      success: false,
      error_type: ListBannedUsersErrorType::BadInput,
      error_message: error_message.to_string()
    }
  }
}

impl ResponseError for ListBannedUsersErrorResponse {
  fn status_code(&self) -> StatusCode {
    match self.error_type {
      ListBannedUsersErrorType::BadInput => StatusCode::BAD_REQUEST,
      ListBannedUsersErrorType::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      ListBannedUsersErrorType::Unauthorized => StatusCode::UNAUTHORIZED,
      ListBannedUsersErrorType::UserNotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for ListBannedUsersErrorResponse {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self.error_type)
  }
}

pub async fn list_banned_users_handler(
  http_request: HttpRequest,
  request: web::Json<ListBannedUsersRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListBannedUsersErrorResponse> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListBannedUsersErrorResponse::server_error()
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(ListBannedUsersErrorResponse::unauthorized());
    }
  };

  if !user_session.can_ban_users {
    warn!("user is not allowed to add bans: {:?}", user_session.user_token.as_str());
    return Err(ListBannedUsersErrorResponse::unauthorized());
  }

  // TODO: Implement the endpoint
  unimplemented!()
}
