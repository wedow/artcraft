use actix_web::cookie::Cookie;
use actix_web::http::StatusCode;
use actix_web::web::Query;
use actix_web::{HttpResponse, HttpRequest, Responder, get, web, HttpMessage};
use crate::http_server::endpoints::misc::alpha_cookie::alpha_cookie;
use crate::server_state::ServerState;
use hyper::header::LOCATION;
use log::info;
use std::ops::Deref;
use std::sync::Arc;

#[get("/enable")]
pub async fn enable_alpha_easy_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> impl Responder
{
  info!("GET /enable");

  let cookie = alpha_cookie(&server_state);

  let response = HttpResponse::Found()
      .cookie(cookie)
      .header(LOCATION, server_state.env_config.website_homepage_redirect.deref())
      .finish();

  response
}
