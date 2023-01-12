use actix_web::cookie::Cookie;
use crate::server_state::ServerState;
use tokens::avt::AnonymousVisitorToken;

pub const AVT_COOKIE_NAME: &'static str = "avt";

pub fn avt_cookie(server_state: &ServerState) -> Cookie {
    Cookie::build(AVT_COOKIE_NAME, AnonymousVisitorToken::generate().to_string())
        .domain(&server_state.env_config.cookie_domain)
        .secure(server_state.env_config.cookie_secure) // HTTPS-only
        .http_only(false) // This is meant to be exposed to Javascript!
        .permanent()
        .finish()
}
