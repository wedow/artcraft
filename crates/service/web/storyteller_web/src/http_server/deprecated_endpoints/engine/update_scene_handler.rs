use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse};

use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::deprecated_endpoints::media_uploads::common::upload_error::UploadError;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct UpdateSceneSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

pub async fn update_scene_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  mut multipart_payload: Multipart,
) -> Result<HttpResponse, UploadError> {

  // TODO(bt): Handle upload / save.

  let response = UpdateSceneSuccessResponse {
    success: true,
    media_file_token: MediaFileToken::new_from_str("TODO"),
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| UploadError::ServerError)?;

  return Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body));
}
