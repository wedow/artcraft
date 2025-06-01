use std::fmt;
use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use log::{log, warn};

use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username;
use mysql_queries::queries::users::user_roles::list_user_roles::list_user_roles;
use mysql_queries::queries::users::user_roles::set_user_role::set_user_role;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct SetUserRolePathInfo {
  username: String,
}

#[derive(Deserialize)]
pub struct SetUserRoleRequest {
  user_role_slug: String,
}

#[derive(Debug)]
pub enum SetUserRoleError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  ServerError,
}

impl ResponseError for SetUserRoleError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SetUserRoleError::BadInput(_) => StatusCode::BAD_REQUEST,
      SetUserRoleError::NotAuthorized => StatusCode::UNAUTHORIZED,
      SetUserRoleError::NotFound => StatusCode::NOT_FOUND,
      SetUserRoleError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      SetUserRoleError::BadInput(reason) => reason.to_string(),
      SetUserRoleError::NotAuthorized => "unauthorized".to_string(),
      SetUserRoleError::NotFound => "not found".to_string(),
      SetUserRoleError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for SetUserRoleError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn set_user_role_handler(
  http_request: HttpRequest,
  path: Path<SetUserRolePathInfo>,
  request: web::Json<SetUserRoleRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, SetUserRoleError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        SetUserRoleError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(SetUserRoleError::NotAuthorized);
    }
  };

  // TODO: This is not the correct permission
  if !user_session.can_ban_users {
    warn!("user is not allowed to change user roles: {:?}", user_session.user_token);
    return Err(SetUserRoleError::NotAuthorized);
  }

  // TODO: This is lazy and inefficient
  let user_roles = list_user_roles(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("error listing roles: {:?}", err);
        SetUserRoleError::ServerError
      })?;

  let role_exists = user_roles.into_iter()
      .find(|user_role| user_role.slug == request.user_role_slug)
      .is_some();

  if !role_exists {
    return Err(SetUserRoleError::BadInput("invalid user role".to_string()));
  }

  let user_lookup_result =
      get_user_profile_by_username(&path.username, &server_state.mysql_pool).await;

  let target_user = match user_lookup_result {
    Ok(Some(result)) => result,
    Ok(None) => return Err(SetUserRoleError::NotFound),
    Err(err) => {
      warn!("lookup error: {:?}", err);
      return Err(SetUserRoleError::ServerError);
    }
  };

  let query_result = set_user_role(
    &target_user.user_token,
    &request.user_role_slug,
    &server_state.mysql_pool,
  ).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("unable to update user role: {:?}", err);
      return Err(SetUserRoleError::ServerError);
    }
  };

  Ok(simple_json_success())
}
