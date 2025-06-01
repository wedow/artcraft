//! A temporary cookie for investor demo

use actix_web::HttpRequest;

pub const STORYTELLER_DEMO_COOKIE_NAME : &str = "storyteller_demo";

pub fn request_has_demo_cookie(http_request: &HttpRequest) -> bool {
  // NB: Payload of the cookie does not matter.
  http_request.cookie(STORYTELLER_DEMO_COOKIE_NAME).is_some()
}
