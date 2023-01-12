use std::sync::Arc;

use actix_http::StatusCode;
use actix_web::{HttpResponse, Responder, HttpRequest, get, web};
use super::avt_cookie::avt_cookie;

use crate::server_state::ServerState;

#[get("/avt")]
pub async fn avt_handler(
    http_request: HttpRequest,
    server_state: web::Data<Arc<ServerState>>
) -> impl Responder {
    HttpResponse::build(StatusCode::OK)
    .cookie(avt_cookie(&server_state))
    .body(String::new())
}


