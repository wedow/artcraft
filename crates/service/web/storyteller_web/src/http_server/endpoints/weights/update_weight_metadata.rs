
use std::fmt;
use std::sync::Arc;
use actix_web::{HttpRequest, HttpResponseBuilder, HttpResponse, ResponseError, web};
use actix_web::http::StatusCode;
use log::{error, info,warn};
use serde::Deserialize;
use serde::Serialize;
use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::server_state::ServerState;

#[derive(Debug, Serialize)]
pub enum UpdateWeightMetaDataError {
    BadInput(String),
    NotAuthorized,
    NotFound,
    ServerError,
}

impl ResponseError for UpdateWeightMetaDataError {
    fn status_code(&self) -> StatusCode {
        match *self {
            UpdateWeightMetaDataError::BadInput(_) => StatusCode::BAD_REQUEST,
            UpdateWeightMetaDataError::NotAuthorized => StatusCode::UNAUTHORIZED,
            UpdateWeightMetaDataError::NotFound => StatusCode::NOT_FOUND,
            UpdateWeightMetaDataError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

impl fmt::Display for UpdateWeightMetaDataError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Deserialize)]
pub struct WeightsMetaData {
    user_id: String,
    weight_type: String, // Convert to an enum
}
pub async fn update_weight_metadata_handler(
    http_request: HttpRequest,
    request: web::Json<WeightsMetaData>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, UpdateWeightMetaDataError> {
    Ok(HttpResponse::Ok().body("update_weight_metadata_handler"))
}
