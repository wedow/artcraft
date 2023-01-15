use std::sync::Arc;

use actix_http::StatusCode;
use actix_web::{HttpResponse, Responder, HttpRequest, get, web};
use log::warn;
use super::avt_cookie::avt_cookie;
use anyhow::anyhow;

use crate::server_state::ServerState;

#[derive(Debug, Serialize)]
pub enum AvtError {
    GenerationFailed(String),
}

impl std::fmt::Display for AvtError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!("{:?}", self))
    }
}

pub async fn avt_handler(
    http_request: HttpRequest,
    server_state: web::Data<Arc<ServerState>>
) -> impl Responder {
    let maybe_avt_cookie = avt_cookie(&server_state).map_err(|e|
        {
            let avt_err = AvtError::GenerationFailed(e.to_string());
            warn!("{}", avt_err);
            avt_err
        }
    );
    match maybe_avt_cookie {
        Ok(cookie) => {
            HttpResponse::build(StatusCode::OK)
                .cookie(cookie.0)
                .body(String::new())
        }
        Err(e) => {
            HttpResponse::build(StatusCode::INTERNAL_SERVER_ERROR)
                .body(e.to_string())
        }
    }
}


