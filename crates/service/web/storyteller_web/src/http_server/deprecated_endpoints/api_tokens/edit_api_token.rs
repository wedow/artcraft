use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};

use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::api_tokens::edit_api_token::edit_api_token;
use mysql_queries::queries::api_tokens::list_available_api_tokens_for_user::list_available_api_tokens_for_user;

use crate::state::server_state::ServerState;

// =============== Request ===============

// NB: Ordinarily, `api_token` would be PathInfo, but these are secret values.

// These are not sparse updates!
#[derive(Deserialize)]
pub struct EditApiTokenRequest {
  pub api_token: String,
  pub maybe_short_description: Option<String>,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct EditApiTokenResponse {
  pub success: bool,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum EditApiTokenError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for EditApiTokenError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EditApiTokenError::BadInput(_) => StatusCode::BAD_REQUEST,
      EditApiTokenError::NotFound => StatusCode::NOT_FOUND,
      EditApiTokenError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EditApiTokenError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EditApiTokenError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn edit_api_token_handler(
  http_request: HttpRequest,
  request: web::Json<EditApiTokenRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EditApiTokenError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        EditApiTokenError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(EditApiTokenError::NotAuthorized);
    }
  };

  if user_session.is_banned {
    warn!("banned users cannot edit API tokens");
    return Err(EditApiTokenError::NotAuthorized);
  }

  let tokens = list_available_api_tokens_for_user(
    user_session.user_token.as_str(),
    &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Error querying tokens: {:?}", e);
        EditApiTokenError::ServerError
      })?;

  let valid_token = tokens.iter()
      .find(|t| t.api_token.eq(&request.api_token))
      .is_some();

  if !valid_token {
    warn!("Invalid API Token");
    return Err(EditApiTokenError::NotFound);
  }

  let creator_ip_address = get_request_ip(&http_request);

  let _r = edit_api_token(
    user_session.user_token.as_str(),
    &request.api_token,
    request.maybe_short_description.as_deref(),
    &creator_ip_address,
    &server_state.mysql_pool)
      .await
      .map_err(|e| {
        error!("Error with query: {:?}", e);
        EditApiTokenError::ServerError
      });

  let response = EditApiTokenResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| EditApiTokenError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
