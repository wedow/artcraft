use std::fmt;
use std::sync::Arc;
use actix_web::{ HttpRequest, HttpResponseBuilder, HttpResponse, ResponseError, web };
use actix_web::http::StatusCode;
use log::{ error, info, warn };
use serde::Deserialize;
use serde::Serialize;
use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::server_state::ServerState;

#[derive(Debug, Serialize)]
pub enum GetWeightsByUserError {
    BadInput(String),
    NotAuthorized,
    UserNotFound,
    ServerError,
}

impl ResponseError for GetWeightsByUserError {
    fn status_code(&self) -> StatusCode {
        match *self {
            GetWeightsByUserError::BadInput(_) => StatusCode::BAD_REQUEST,
            GetWeightsByUserError::NotAuthorized => StatusCode::UNAUTHORIZED,
            GetWeightsByUserError::UserNotFound => StatusCode::NOT_FOUND,
            GetWeightsByUserError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

impl fmt::Display for GetWeightsByUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Deserialize)]
pub struct GetWeightsByUserRequest {
    user_id: String,
}

pub async fn get_weights_by_user_handler(
    http_request: HttpRequest,
    request: web::Json<GetWeightsByUserRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetWeightsByUserError> {
    Ok(HttpResponse::Ok().body("get_weights_by_user_handler"))
}
