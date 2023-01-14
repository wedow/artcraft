use actix_web::http::header;
use actix_web::HttpResponseBuilder;
use actix_web::http::StatusCode;
use actix_web::{HttpResponse, ResponseError};

#[derive(Serialize)]
pub struct SimpleGenericJsonError {
  pub success: bool,
  pub error_reason: String,
}

pub fn to_simple_json_error(
  error_reason: &str,
  status_code: StatusCode,
) -> HttpResponse {

  let response = SimpleGenericJsonError {
    success: false,
    error_reason : error_reason.to_string(),
  };

  let body = match serde_json::to_string(&response) {
    Ok(json) => json,
    Err(_) => "{}".to_string(),
  };

  HttpResponseBuilder::new(status_code)
      .set_header(header::CONTENT_TYPE, "application/json")
      .body(body)
}