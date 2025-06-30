use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use mysql_queries::queries::tts::tts_results::delete_tts_result_various_scopes::delete_tts_inference_result_as_mod;
use mysql_queries::queries::tts::tts_results::delete_tts_result_various_scopes::delete_tts_inference_result_as_user;
use mysql_queries::queries::tts::tts_results::delete_tts_result_various_scopes::undelete_tts_inference_result_as_mod;
use mysql_queries::queries::tts::tts_results::delete_tts_result_various_scopes::undelete_tts_inference_result_as_user;
use mysql_queries::queries::tts::tts_results::query_tts_result::select_tts_result_by_token;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::delete_role_disambiguation;
use crate::util::delete_role_disambiguation::DeleteRole;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteTtsInferenceResultPathInfo {
  token: String,
}

#[derive(Deserialize)]
pub struct DeleteTtsInferenceResultRequest {
  set_delete: bool,
  /// NB: this is only to disambiguate when a user is both a mod and an author.
  as_mod: Option<bool>,
}

#[derive(Debug)]
pub enum DeleteTtsInferenceResultError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  ServerError,
}

impl ResponseError for DeleteTtsInferenceResultError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteTtsInferenceResultError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteTtsInferenceResultError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteTtsInferenceResultError::NotFound => StatusCode::NOT_FOUND,
      DeleteTtsInferenceResultError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      DeleteTtsInferenceResultError::BadInput(reason) => reason.to_string(),
      DeleteTtsInferenceResultError::NotAuthorized => "unauthorized".to_string(),
      DeleteTtsInferenceResultError::NotFound => "not found".to_string(),
      DeleteTtsInferenceResultError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DeleteTtsInferenceResultError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn delete_tts_inference_result_handler(
  http_request: HttpRequest,
  path: Path<DeleteTtsInferenceResultPathInfo>,
  request: web::Json<DeleteTtsInferenceResultRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteTtsInferenceResultError> {
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteTtsInferenceResultError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(DeleteTtsInferenceResultError::NotAuthorized);
    }
  };

  // NB: First permission check.
  // Only mods should see deleted models (both user_* and mod_* deleted).
  let is_mod_that_can_see_deleted = user_session.can_delete_other_users_tts_results;

  let inference_result_query_result = select_tts_result_by_token(
    &path.token,
    is_mod_that_can_see_deleted,
    &server_state.mysql_pool,
  ).await;

  let tts_inference_result = match inference_result_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(DeleteTtsInferenceResultError::ServerError);
    }
    Ok(None) => return Err(DeleteTtsInferenceResultError::NotFound),
    Ok(Some(inference_result)) => inference_result,
  };

  // NB: Second set of permission checks
  let is_author = tts_inference_result.maybe_creator_user_token
      .as_ref()
      .map(|creator_token| creator_token == &user_session.user_token)
      .unwrap_or(false);

  let is_mod = user_session.can_delete_other_users_tts_results;

  if !is_author && !is_mod {
    warn!("user is not allowed to delete inference results: {:?}", user_session.user_token);
    return Err(DeleteTtsInferenceResultError::NotAuthorized);
  }

  let delete_role = delete_role_disambiguation(is_mod, is_author, request.as_mod);

  let query_result = if request.set_delete {
    match delete_role {
      DeleteRole::ErrorDoNotDelete => {
        warn!("user is not allowed to delete inference results: {:?}", user_session.user_token);
        return Err(DeleteTtsInferenceResultError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        delete_tts_inference_result_as_user(
          &path.token,
          &server_state.mysql_pool
        ).await
      }
      DeleteRole::AsMod => {
        delete_tts_inference_result_as_mod(
          &path.token,
          user_session.user_token.as_str(),
          &server_state.mysql_pool
        ).await
      }
    }
  } else {
    match delete_role {
      DeleteRole::ErrorDoNotDelete => {
        warn!("user is not allowed to undelete inference results: {:?}", user_session.user_token);
        return Err(DeleteTtsInferenceResultError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        // NB: Technically only mods can see their own inference_results here
        undelete_tts_inference_result_as_user(
          &path.token,
          &server_state.mysql_pool
        ).await
      }
      DeleteRole::AsMod => {
        undelete_tts_inference_result_as_mod(
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
      warn!("Update tts mod approval status DB error: {:?}", err);
      return Err(DeleteTtsInferenceResultError::ServerError);
    }
  };

  Ok(simple_json_success())
}
