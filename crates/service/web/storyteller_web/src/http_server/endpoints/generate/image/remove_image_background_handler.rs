use std::fmt;
use std::sync::Arc;

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::common_responses::media::media_links::MediaLinks;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use artcraft_api_defs::generate::image::remove_image_background::RemoveImageBackgroundRequest;
use artcraft_api_defs::generate::image::remove_image_background::RemoveImageBackgroundResponse;
use fal_client::requests::remove_background_rembg::remove_background_rembg_from_url::remove_background_rembg_from_url;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::warn;
use mysql_queries::queries::media_files::edit::rename_media_file::rename_media_file;
use mysql_queries::queries::media_files::get::get_media_file::{get_media_file, MediaFile};
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

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
    (status = 200, description = "Success", body = RemoveImageBackgroundResponse),
    (status = 400, description = "Bad input", body = RemoveImageBackgroundError),
    (status = 401, description = "Not authorized", body = RemoveImageBackgroundError),
    (status = 500, description = "Server error", body = RemoveImageBackgroundError),
  ),
  params(
    ("request" = RemoveImageBackgroundRequest, description = "Payload for Request"),
  )
)]
pub async fn remove_image_background_handler(
  http_request: HttpRequest,
  request: Json<RemoveImageBackgroundRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<RemoveImageBackgroundResponse>, RemoveImageBackgroundError> {
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

  let media_file_token = match &request.media_file_token {
    Some(token) => token,
    None => {
      warn!("No media file token provided");
      return Err(RemoveImageBackgroundError::BadInput("No media file token provided".to_string()));
    }
  };
  
  const IS_MOD : bool = false;
  
  let media_file_lookup_result = get_media_file(
    media_file_token,
    IS_MOD,
    &server_state.mysql_pool,
  ).await;

  let media_file = match media_file_lookup_result {
    Ok(Some(media_file)) => media_file,
    Ok(None) => {
      warn!("MediaFile not found: {:?}", media_file_token);
      return Err(RemoveImageBackgroundError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up media_file: {:?}", err);
      return Err(RemoveImageBackgroundError::ServerError);
    }
  };

  if !media_file.media_type.is_jpg_or_png() {
    return Err(RemoveImageBackgroundError::BadInput("Media file must be a JPG or PNG image".to_string()));
  }
  
  let media_domain = get_media_domain(&http_request);
  
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref());
  
  let media_links = MediaLinks::from_media_path_and_env(
    media_domain, 
    server_state.server_environment, 
    &bucket_path);
  
  
  let fal_result = remove_background_rembg_from_url(
    media_links.cdn_url.to_string(),
    &server_state.fal_api_key
  ).await.map_err(|err| {
    warn!("Error removing background: {:?}", err);
    RemoveImageBackgroundError::ServerError
  });
  
  match fal_result {
    Ok(response) => {
      response
    },
    Err(err) => {
      warn!("Error removing background: {:?}", err);
      return Err(RemoveImageBackgroundError::ServerError)
    }
  }
  

  Ok(Json(RemoveImageBackgroundResponse {
    success: true,
    inference_job_token: (),
  }))
}
