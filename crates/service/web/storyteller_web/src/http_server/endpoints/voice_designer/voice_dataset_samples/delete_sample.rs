use std::sync::Arc;

use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use log::warn;

use http_server_common::response::response_error_helpers::to_simple_json_error;
use http_server_common::response::response_success_helpers::simple_json_success;
use mysql_queries::queries::voice_designer::voice_samples::delete_sample::{delete_sample_as_mod, delete_sample_as_user, undelete_sample_as_mod, undelete_sample_as_user};
use mysql_queries::queries::voice_designer::voice_samples::get_dataset_sample::get_dataset_sample_by_token;
use tokens::tokens::zs_voice_dataset_samples::ZsVoiceDatasetSampleToken;

use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};

// TODO(bt,2023-10-10): This is way too much boilerplate.

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteSamplePathInfo {
  sample_token: ZsVoiceDatasetSampleToken,
}

#[derive(Deserialize)]
pub struct DeleteSampleRequest {
  set_delete: bool,
  /// NB: this is only to disambiguate when a user is both a mod and an author.
  as_mod: Option<bool>,
}

#[derive(Debug)]
pub enum DeleteSampleError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  ServerError,
}

impl ResponseError for DeleteSampleError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteSampleError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteSampleError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteSampleError::NotFound => StatusCode::NOT_FOUND,
      DeleteSampleError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      DeleteSampleError::BadInput(reason) => reason.to_string(),
      DeleteSampleError::NotAuthorized => "unauthorized".to_string(),
      DeleteSampleError::NotFound => "not found".to_string(),
      DeleteSampleError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for DeleteSampleError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}
pub async fn delete_sample_handler(
  http_request: HttpRequest,
  path: Path<DeleteSamplePathInfo>,
  request: web::Json<DeleteSampleRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteSampleError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteSampleError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(DeleteSampleError::NotAuthorized);
    }
  };

  // NB: First permission check.
  // Only mods should see deleted models (both user_* and mod_* deleted).
  let is_mod_that_can_see_deleted = user_session.can_delete_other_users_tts_results;

  let inference_result_query_result = get_dataset_sample_by_token(
    &path.sample_token,
    is_mod_that_can_see_deleted,
    &server_state.mysql_pool,
  ).await;

  let dataset_sample = match inference_result_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(DeleteSampleError::ServerError);
    }
    Ok(None) => return Err(DeleteSampleError::NotFound),
    Ok(Some(sample)) => sample,
  };

  // NB: Second set of permission checks
  let is_author = dataset_sample.maybe_creator_user_token
      .as_ref()
      .map(|creator_token| creator_token == &user_session.user_token)
      .unwrap_or(false);

  let is_mod = user_session.can_delete_other_users_tts_results;

  if !is_author && !is_mod {
    warn!("user is not allowed to delete samples: {:?}", user_session.user_token);
    return Err(DeleteSampleError::NotAuthorized);
  }

  let delete_role = delete_role_disambiguation(is_mod, is_author, request.as_mod);

  let query_result = if request.set_delete {
    match delete_role  {
      DeleteRole::ErrorDoNotDelete => {
        return Err(DeleteSampleError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        delete_sample_as_user(&path.sample_token, &server_state.mysql_pool).await
      }
      DeleteRole::AsMod => {
        delete_sample_as_mod(&path.sample_token, &user_session.user_token, &server_state.mysql_pool).await
      }
    }
  } else {
    match delete_role  {
      DeleteRole::ErrorDoNotDelete => {
        return Err(DeleteSampleError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        undelete_sample_as_user(&path.sample_token, &server_state.mysql_pool).await
      }
      DeleteRole::AsMod => {
        undelete_sample_as_mod(&path.sample_token, &user_session.user_token, &server_state.mysql_pool).await
      }
    }
  };

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Delete DB error: {:?}", err);
      return Err(DeleteSampleError::ServerError);
    }
  };

  Ok(simple_json_success())
}
