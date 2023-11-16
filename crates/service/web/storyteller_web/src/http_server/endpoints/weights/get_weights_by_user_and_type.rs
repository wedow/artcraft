
use std::fmt::Debug;
use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use log::warn;
use serde::Deserialize;
use serde::Serialize;


impl ResponseError for GetWeightsByUserAndTypeError {
    fn status_code(&self) -> StatusCode {
        match *self {
            GetWeightsByUserAndTypeError::BadInput(_) => StatusCode::BAD_REQUEST,
            GetWeightsByUserAndTypeError::NotAuthorized => StatusCode::UNAUTHORIZED,
            GetWeightsByUserAndTypeError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

impl fmt::Display for GetWeightsByUserAndTypeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}


pub async fn get_weights_by_user_and_type_handler(
    http_request: HttpRequest,
    request: web::Json<EnqueueCreateVoiceRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetWeightsByUserAndTypeError> {
    Ok(HttpResponse::Ok());
}