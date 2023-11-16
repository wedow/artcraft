
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
pub enum GetWeightDetailsError {
    BadInput(String),
    NotAuthorized,
    NotFound,
    ServerError
}

impl ResponseError for GetWeightDetailsError {
    fn status_code(&self) -> StatusCode {
        match *self {
            GetWeightDetailsError::BadInput(_) => StatusCode::BAD_REQUEST,
            GetWeightDetailsError::NotAuthorized => StatusCode::UNAUTHORIZED,
            GetWeightDetailsError::NotFound => StatusCode::NOT_FOUND,
            GetWeightDetailsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

impl fmt::Display for GetWeightDetailsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Deserialize)]
pub struct GetWeightDetailsRequest {
    user_id: String,
    weight_id: String,
}

pub async fn get_weight_details_handler(
    http_request: HttpRequest,
    request: web::Json<GetWeightDetailsRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetWeightDetailsError> {
    Ok(HttpResponse::Ok().body("get_weight_details_handler"))
}