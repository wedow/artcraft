use std::fmt;
use std::sync::Arc;

use actix_web::{ HttpRequest, HttpResponse, web };
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use log::warn;
use serde::Deserialize;
use serde::Serialize;
use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;

use crate::server_state::ServerState;

#[derive(Debug, Serialize)]
pub enum UploadWeightsError {
    BadInput(String),
    NotAuthorized,
    MustBeLoggedIn,
    ServerError,
    RateLimited,
}

impl ResponseError for UploadWeightsError {
    fn status_code(&self) -> StatusCode {
        match *self {
            UploadWeightsError::BadInput(_) => StatusCode::BAD_REQUEST,
            UploadWeightsError::NotAuthorized => StatusCode::UNAUTHORIZED,
            UploadWeightsError::MustBeLoggedIn => StatusCode::UNAUTHORIZED,
            UploadWeightsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            UploadWeightsError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

impl fmt::Display for UploadWeightsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Deserialize)]
pub struct Weights {
    user_id: String,
    weight_type: String, // Convert to an enum
}

pub async fn upload_weights_handler(
    http_request: HttpRequest,
    request: web::Json<Weights>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, UploadWeightsError> {
    Ok(HttpResponse::Ok().body("upload_weights_handler"))
}
