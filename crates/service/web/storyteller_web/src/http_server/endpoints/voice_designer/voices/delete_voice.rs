use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::voice_designer::voices::delete_voice::{delete_voice_as_mod, delete_voice_as_user, undelete_voice_as_mod, undelete_voice_as_user};
use mysql_queries::queries::voice_designer::voices::get_voice::get_voice_by_token;
use tokens::tokens::zs_voices::ZsVoiceToken;

use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};

#[derive(Deserialize)]
pub struct DeleteVoiceRequest {
  set_delete: bool,
  /// NB: this is only to disambiguate when a user is both a mod and an author.
  as_mod: Option<bool>,
}

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteVoicePathInfo {
  voice_token: String,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum DeleteVoiceError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for DeleteVoiceError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteVoiceError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteVoiceError::NotFound => StatusCode::NOT_FOUND,
      DeleteVoiceError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteVoiceError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DeleteVoiceError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn delete_voice_handler(
  http_request: HttpRequest,
  path: Path<DeleteVoicePathInfo>,
  request: web::Json<DeleteVoiceRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteVoiceError>{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteVoiceError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(DeleteVoiceError::NotAuthorized);
    }
  };

  let voice_token = path.voice_token.clone();
  let is_mod = user_session.can_ban_users;

  let voice_lookup_result = get_voice_by_token(
    &ZsVoiceToken::new(voice_token.clone()),
    is_mod,
    &server_state.mysql_pool,
  ).await;

  let voice = match voice_lookup_result {
    Ok(Some(voice)) => voice,
    Ok(None) => {
      warn!("Voice not found: {:?}", voice_token);
      return Err(DeleteVoiceError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up voice: {:?}", err);
      return Err(DeleteVoiceError::ServerError);
    }
  };

  let is_creator = voice.maybe_creator_user_token.as_ref()
      .map(|creator_user_token| creator_user_token == &user_session.user_token)
      .unwrap_or(false);

  if !is_creator && !is_mod {
    warn!("user is not allowed to delete this voice: {:?}", user_session.user_token);
    return Err(DeleteVoiceError::NotAuthorized);
  }

  let delete_role = delete_role_disambiguation(is_mod, is_creator, request.as_mod);

  let query_result = if request.set_delete {
    match delete_role {
      DeleteRole::ErrorDoNotDelete => {
        warn!("user is not allowed to delete voices: {:?}", user_session.user_token);
        return Err(DeleteVoiceError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        delete_voice_as_user(
          &path.voice_token,
          &server_state.mysql_pool
        ).await
      }
      DeleteRole::AsMod => {
        delete_voice_as_mod(
          &path.voice_token,
          user_session.user_token.as_str(),
          &server_state.mysql_pool
        ).await
      }
    }
  } else {
    match delete_role {
      DeleteRole::ErrorDoNotDelete => {
        warn!("user is not allowed to undelete voices: {:?}", user_session.user_token);
        return Err(DeleteVoiceError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        undelete_voice_as_user(
          &path.voice_token,
          &server_state.mysql_pool
        ).await
      }
      DeleteRole::AsMod => {
        undelete_voice_as_mod(
          &path.voice_token,
          user_session.user_token.as_str(),
          &server_state.mysql_pool
        ).await
      }
    }
  };

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Update voice mod approval status DB error: {:?}", err);
      return Err(DeleteVoiceError::ServerError);
    }
  };

  Ok(simple_json_success())
}