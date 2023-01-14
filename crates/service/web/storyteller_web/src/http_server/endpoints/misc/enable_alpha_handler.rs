use actix_web::cookie::Cookie;
use actix_web::http::StatusCode;
use actix_web::web::Query;
use actix_web::{HttpResponse, HttpRequest, Responder, get, web, HttpMessage};
use crate::http_server::endpoints::misc::alpha_cookie::{ALPHA_COOKIE_NAME, alpha_cookie};
use crate::server_state::ServerState;
use log::info;
use std::sync::Arc;

const CONTENT_TYPE : &'static str = "text/html; charset=utf-8";

const ENABLE_LINK : &'static str = "<a href=\"/alpha?enable=true\">I want Vocodes 2.0</a>";
const DISABLE_LINK : &'static str = "<a href=\"/alpha?enable=false\">I don't want Vocodes 2.0</a>";
const STATUS_LINK : &'static str = "<a href=\"/alpha\">status</a>";


#[derive(Deserialize)]
pub struct QueryFields {
  enable: Option<bool>,
}

#[get("/alpha")]
pub async fn enable_alpha_handler(http_request: HttpRequest,
                          query: Query<QueryFields>,
                          server_state: web::Data<Arc<ServerState>>) -> impl Responder
{
  info!("GET /alpha");

  let mut cookie = alpha_cookie(&server_state);

  match query.enable {
    None => {
      let cookie_exists = http_request.cookie(ALPHA_COOKIE_NAME).is_some();

      HttpResponse::build(StatusCode::OK)
        .content_type(CONTENT_TYPE)
        .body(format!("<h1>Vocodes 2.0</h1><p>Current `{}` cookie state = {}</p> {} | {} | {}",
                      ALPHA_COOKIE_NAME, cookie_exists, ENABLE_LINK, DISABLE_LINK, STATUS_LINK))
    }
    Some(true) => {
      HttpResponse::build(StatusCode::OK)
        .content_type(CONTENT_TYPE)
        .cookie(cookie)
        .body(format!("<h1>Vocodes 2.0</h1><h2>setting `{}` cookie</h2> {} | {} | {}",
                      ALPHA_COOKIE_NAME, ENABLE_LINK, DISABLE_LINK, STATUS_LINK))
    }
    Some(false) => {
      cookie.make_removal();

      HttpResponse::build(StatusCode::OK)
        .content_type(CONTENT_TYPE)
        .cookie(cookie)
        .body(format!("<h1>Vocodes 2.0</h1><h2>unsetting `{}` cookie</h2> {} | {} | {}",
                      ALPHA_COOKIE_NAME, ENABLE_LINK, DISABLE_LINK, STATUS_LINK))
    }
  }
}
