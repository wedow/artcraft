
use std::fmt;
use std::sync::Arc;
use actix_web::{HttpRequest, HttpResponseBuilder, HttpResponse, ResponseError, web};
use actix_web::http::StatusCode;
use actix_web::web::Json;
use log::{error, info,warn};
use serde::Deserialize;
use serde::Serialize;
use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::server_state::ServerState;


#[derive(Debug, Serialize)]
pub enum GetWeightsByUserAndTypeError {
  BadInput(String),
  NotAuthorized,
  UserNotFound,
  ServerError,
}

impl ResponseError for GetWeightsByUserAndTypeError {
    fn status_code(&self) -> StatusCode {
        match *self {
            GetWeightsByUserAndTypeError::BadInput(_) => StatusCode::BAD_REQUEST,
            GetWeightsByUserAndTypeError::NotAuthorized => StatusCode::UNAUTHORIZED,
            GetWeightsByUserAndTypeError::UserNotFound => StatusCode::NOT_FOUND,
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

#[derive(Deserialize)]
pub struct WeightsByUserAndTypeRequest {
    user_id: String,
    weight_type: String, // Convert to an enum
}

pub async fn get_weights_by_user_and_type_handler(
    http_request: HttpRequest,
    request: web::Json<WeightsByUserAndTypeRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetWeightsByUserAndTypeError> {
    Ok(HttpResponse::Ok().body("get_weights_by_user_and_type_handler"))
}