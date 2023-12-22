use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::HttpResponse;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;

#[derive(Debug, Serialize)]
pub enum MediaFileUploadError {
  BadInput(String),
  NotAuthorized,
  MustBeLoggedIn,
  ServerError,
  RateLimited,
}

impl ResponseError for MediaFileUploadError {
  fn status_code(&self) -> StatusCode {
    match *self {
      MediaFileUploadError::BadInput(_) => StatusCode::BAD_REQUEST,
      MediaFileUploadError::NotAuthorized => StatusCode::UNAUTHORIZED,
      MediaFileUploadError::MustBeLoggedIn => StatusCode::UNAUTHORIZED,
      MediaFileUploadError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      MediaFileUploadError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

impl std::fmt::Display for MediaFileUploadError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}
