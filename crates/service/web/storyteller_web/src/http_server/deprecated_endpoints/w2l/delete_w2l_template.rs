use std::fmt;
use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use log::{log, warn};

use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::w2l::w2l_templates::delete_w2l_template_various_scopes::delete_w2l_template_as_mod;
use mysql_queries::queries::w2l::w2l_templates::delete_w2l_template_various_scopes::delete_w2l_template_as_user;
use mysql_queries::queries::w2l::w2l_templates::delete_w2l_template_various_scopes::undelete_w2l_template_as_mod;
use mysql_queries::queries::w2l::w2l_templates::delete_w2l_template_various_scopes::undelete_w2l_template_as_user;
use mysql_queries::queries::w2l::w2l_templates::get_w2l_template::select_w2l_template_by_token;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::delete_role_disambiguation;
use crate::util::delete_role_disambiguation::DeleteRole;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteW2lTemplatePathInfo {
  token: String,
}

#[derive(Deserialize)]
pub struct DeleteW2lTemplateRequest {
  set_delete: bool,
  /// NB: this is only to disambiguate when a user is both a mod and an author.
  as_mod: Option<bool>,
}

#[derive(Debug)]
pub enum DeleteW2lTemplateError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  ServerError,
}

impl ResponseError for DeleteW2lTemplateError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteW2lTemplateError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteW2lTemplateError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteW2lTemplateError::NotFound => StatusCode::NOT_FOUND,
      DeleteW2lTemplateError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      DeleteW2lTemplateError::BadInput(reason) => reason.to_string(),
      DeleteW2lTemplateError::NotAuthorized => "unauthorized".to_string(),
      DeleteW2lTemplateError::NotFound => "not found".to_string(),
      DeleteW2lTemplateError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DeleteW2lTemplateError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn delete_w2l_template_handler(
  http_request: HttpRequest,
  path: Path<DeleteW2lTemplatePathInfo>,
  request: web::Json<DeleteW2lTemplateRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteW2lTemplateError> {
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteW2lTemplateError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(DeleteW2lTemplateError::NotAuthorized);
    }
  };

  // NB: First permission check.
  // Only mods should see deleted models (both user_* and mod_* deleted).
  let is_mod_that_can_see_deleted = user_session.can_delete_other_users_w2l_templates;

  let template_query_result = select_w2l_template_by_token(
    &path.token,
    is_mod_that_can_see_deleted,
    &server_state.mysql_pool,
  ).await;

  let w2l_template = match template_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(DeleteW2lTemplateError::ServerError);
    }
    Ok(None) => return Err(DeleteW2lTemplateError::NotFound),
    Ok(Some(template)) => template,
  };

  // NB: Second set of permission checks
  let is_author = w2l_template.creator_user_token == user_session.user_token.as_str();
  let is_mod = user_session.can_delete_other_users_w2l_templates;

  if !is_author && !is_mod {
    warn!("user is not allowed to delete templates: {:?}", user_session.user_token);
    return Err(DeleteW2lTemplateError::NotAuthorized);
  }

  if !is_mod {
    if w2l_template.is_locked_from_user_modification || w2l_template.is_locked_from_use {
      warn!("user is not allowed to delete templates (locked): {:?}", user_session.user_token);
      return Err(DeleteW2lTemplateError::NotAuthorized);
    }
  }

  let ip_address = get_request_ip(&http_request);

  let delete_role = delete_role_disambiguation(is_mod, is_author, request.as_mod);

  let query_result = if request.set_delete {
    match delete_role {
      DeleteRole::ErrorDoNotDelete => {
        warn!("user is not allowed to delete template: {:?}", user_session.user_token);
        return Err(DeleteW2lTemplateError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        delete_w2l_template_as_user(
          &path.token,
          &ip_address,
          &server_state.mysql_pool
        ).await
      }
      DeleteRole::AsMod => {
        delete_w2l_template_as_mod(
          &path.token,
          user_session.user_token.as_str(),
          &server_state.mysql_pool
        ).await
      }
    }
  } else {
    match delete_role {
      DeleteRole::ErrorDoNotDelete => {
        warn!("user is not allowed to delete template: {:?}", user_session.user_token);
        return Err(DeleteW2lTemplateError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        // NB: Technically only mods can see their own templates here
        undelete_w2l_template_as_user(
          &path.token,
          &ip_address,
          &server_state.mysql_pool
        ).await
      }
      DeleteRole::AsMod => {
        undelete_w2l_template_as_mod(
          &path.token,
          user_session.user_token.as_str(),
          &server_state.mysql_pool
        ).await
      }
    }
  };

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Update w2l mod approval status DB error: {:?}", err);
      return Err(DeleteW2lTemplateError::ServerError);
    }
  };

  Ok(simple_json_success())
}

