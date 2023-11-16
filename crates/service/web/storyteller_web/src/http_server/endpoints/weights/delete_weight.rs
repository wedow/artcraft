
use std::fmt;
use std::sync::Arc;
use actix_web::{HttpRequest, HttpResponseBuilder, HttpResponse, ResponseError,web};
use actix_web::http::StatusCode;
use log::{error, info,warn};
use serde::Deserialize;
use serde::Serialize;
use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::server_state::ServerState;

#[derive(Debug, Serialize)]
pub enum DeleteWeightsError {
    BadInput(String),
    NotAuthorized,
    NotFound,
    ServerError,
}

impl ResponseError for DeleteWeightsError {
    fn status_code(&self) -> StatusCode {
        match *self {
            DeleteWeightsError::BadInput(_) => StatusCode::BAD_REQUEST,
            DeleteWeightsError::NotAuthorized => StatusCode::UNAUTHORIZED,
            DeleteWeightsError::NotFound => StatusCode::NOT_FOUND,
            DeleteWeightsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

impl fmt::Display for DeleteWeightsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Deserialize)]
pub struct DeleteWeightsRequest {
    user_id: String,
    weight_type: String, // Convert to an enum
}

pub async fn delete_weight_handler(
    http_request: HttpRequest,
    request: web::Json<DeleteWeightsRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteWeightsError> {
    Ok(HttpResponse::Ok().body("delete_weight_handler"))
}