use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::HttpResponse;
use utoipa::ToSchema;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;

#[derive(Debug, Serialize, ToSchema)]
pub enum VideoMediaFileUploadError {
  BadInput(String),
  NotAuthorized,
  MustBeLoggedIn,
  ServerError,
  RateLimited,
}

impl ResponseError for VideoMediaFileUploadError {
  fn status_code(&self) -> StatusCode {
    match *self {
      VideoMediaFileUploadError::BadInput(_) => StatusCode::BAD_REQUEST,
      VideoMediaFileUploadError::NotAuthorized => StatusCode::UNAUTHORIZED,
      VideoMediaFileUploadError::MustBeLoggedIn => StatusCode::UNAUTHORIZED,
      VideoMediaFileUploadError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      VideoMediaFileUploadError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

impl std::fmt::Display for VideoMediaFileUploadError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}
