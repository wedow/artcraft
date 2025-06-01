use std::sync::Arc;

use actix_http::header;
use actix_web::cookie::time::OffsetDateTime;
use actix_web::cookie::Cookie;
use actix_web::http::StatusCode;
use actix_web::web::Query;
use actix_web::{web, HttpRequest, HttpResponse, Responder};

use actix_helpers::extractors::get_request_host::get_request_host;

use crate::http_server::deprecated_endpoints::investor_demo::default_redirect::{redirect_is_allowed, DEFAULT_INVESTOR_REDIRECT};
use crate::http_server::deprecated_endpoints::investor_demo::demo_cookie::STORYTELLER_DEMO_COOKIE_NAME;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct QueryFields {
  redirect_to: Option<String>,
}

pub async fn disable_demo_mode_handler(
  http_request: HttpRequest,
  query: Query<QueryFields>,
  server_state: web::Data<Arc<ServerState>>
) -> impl Responder
{
  let unsafe_redirect = query.redirect_to
      .as_deref()
      .map(|r| r.to_string())
      .unwrap_or(DEFAULT_INVESTOR_REDIRECT.to_string());

  let redirect_allowed = redirect_is_allowed(&unsafe_redirect);

  let safe_redirect_url = if redirect_allowed {
    unsafe_redirect
  } else {
    DEFAULT_INVESTOR_REDIRECT.to_string()
  };

  let maybe_host = get_request_host(&http_request);
  let maybe_cookie_domain = match maybe_host {
    Some("jungle.horse") | Some("api.jungle.horse") => Some(".jungle.horse"),
    Some("fakeyou.com") | Some("api.fakeyou.com") => Some(".fakeyou.com"),
    Some("storyteller.io") | Some("api.storyteller.io") => Some(".storyteller.io"),
    _ => None,
  };

  // Kill the cookie
  let mut cookie_builder = Cookie::build(STORYTELLER_DEMO_COOKIE_NAME, "")
      .secure(server_state.env_config.cookie_secure) // HTTPS-only
      .expires(OffsetDateTime::UNIX_EPOCH)
      .http_only(false) // This is meant to be exposed to Javascript!
      // NB: Since we're setting this from direct HTTP access rather than XHR, the browser
      // implicitly sets the path used to access the cookie, ie. '/demo_mode', which is not what
      // we want!
      .path("/")
      .permanent();

  if let Some(cookie_domain) = maybe_cookie_domain {
    cookie_builder = cookie_builder.domain(cookie_domain);
  }

  let mut cookie = cookie_builder.finish();
  cookie.make_removal(); // Remove the cookie

  HttpResponse::build(StatusCode::FOUND)
      .append_header((header::LOCATION, safe_redirect_url.to_string()))
      .cookie(cookie)
      .finish()
}
