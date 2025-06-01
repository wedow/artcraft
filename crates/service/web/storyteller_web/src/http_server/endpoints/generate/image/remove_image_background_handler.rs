use std::fmt;
use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use log::warn;
use utoipa::ToSchema;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::media_files::edit::rename_media_file::rename_media_file;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use tokens::tokens::media_files::MediaFileToken;
use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};

#[derive(Deserialize, ToSchema)]
pub struct RemoveImageBackgroundRequest {
  /// New name for the media file.
  /// If absent or empty string, the name will be cleared
  name: Option<String>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum RemoveImageBackgroundError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for RemoveImageBackgroundError {
  fn status_code(&self) -> StatusCode {
    match *self {
      RemoveImageBackgroundError::BadInput(_) => StatusCode::BAD_REQUEST,
      RemoveImageBackgroundError::NotFound => StatusCode::NOT_FOUND,
      RemoveImageBackgroundError::NotAuthorized => StatusCode::UNAUTHORIZED,
      RemoveImageBackgroundError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for RemoveImageBackgroundError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

/// Change (or remove) the "title" of a media file.
#[utoipa::path(
  post,
  tag = "Generate Images",
  path = "/v1/generate/image/remove_background",
  responses(
    (status = 200, description = "Success", body = SimpleGenericJsonSuccess),
    (status = 400, description = "Bad input", body = RemoveImageBackgroundError),
    (status = 401, description = "Not authorized", body = RemoveImageBackgroundError),
    (status = 500, description = "Server error", body = RemoveImageBackgroundError),
  ),
  params(
    ("request" = RemoveImageBackgroundRequest, description = "Payload for Request"),
    ("path" = MediaFileTokenPathInfo, description = "Path for Request")
  )
)]
pub async fn remove_image_background_handler(
  http_request: HttpRequest,
  path: Path<MediaFileTokenPathInfo>,
  request: web::Json<RemoveImageBackgroundRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, RemoveImageBackgroundError>{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        RemoveImageBackgroundError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(RemoveImageBackgroundError::NotAuthorized);
    }
  };

  let is_mod = user_session.can_ban_users;

  let media_file_lookup_result = get_media_file(
    &path.token,
    is_mod,
    &server_state.mysql_pool,
  ).await;

  let media_file = match media_file_lookup_result {
    Ok(Some(media_file)) => media_file,
    Ok(None) => {
      warn!("MediaFile not found: {:?}", path.token);
      return Err(RemoveImageBackgroundError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up media_file: {:?}", err);
      return Err(RemoveImageBackgroundError::ServerError);
    }
  };

  let is_creator = media_file.maybe_creator_user_token
      .is_some_and(|t| t.as_str() == user_session.user_token.as_str());

  if !is_creator && !is_mod {
    warn!("user is not allowed to delete this media_file: {:?}", user_session.user_token);
    return Err(RemoveImageBackgroundError::NotAuthorized);
  }

  rename_media_file(
    &path.token,
    request.name.as_deref(),
    &server_state.mysql_pool
  ).await.map_err(|err| {
    warn!("Error renaming media_file: {:?}", err);
    RemoveImageBackgroundError::ServerError
  })?;

  Ok(simple_json_success())
}
