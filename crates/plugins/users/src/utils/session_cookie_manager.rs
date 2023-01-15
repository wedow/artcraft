// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::HttpRequest;
use actix_web::cookie::Cookie;
use anyhow::anyhow;
use container_common::anyhow_result::AnyhowResult;
use log::warn;
use std::collections::BTreeMap;
use time::OffsetDateTime;
use super::crypted_cookie_manager::{CryptedCookieManager, CryptedCookie};

/**
 * Cookie version history
 *
 *  Version 1: Claims include "session_token" and "cookie_version"
 *  Version 2: The "user_token" is added to the claims, and the version is bumped to "2"
 */
const COOKIE_VERSION : u32 = 2;

const SESSION_COOKIE_NAME : &'static str = "session";

// TODO(echelon,2022-08-29): Make a CryptedCookieManager that this uses.
// TODO(echelon,2022-08-29): Fix how domains and "secure" cookies are handled

#[derive(Clone)]
pub struct SessionCookieManager<'a> {
  cookie_domain: String,
  ccm: &'a CryptedCookieManager<'a>,
}

#[derive(Clone)]
pub struct SessionCookiePayload {
  /// The database primary key for the session instance.
  pub session_token: String,
  /// The primary key identifier of the user.
  /// Version 1 cookies do not have a user token, hence it is optional.
  pub maybe_user_token: Option<String>,
}

impl<'a> SessionCookieManager<'a> {
  pub fn new(cookie_domain: &str, ccm: &'a CryptedCookieManager) -> Self {
    Self {
      cookie_domain: cookie_domain.to_string(),
      ccm
    }
  }

  pub fn create_cookie(&self, session_token: &str, user_token: &str) -> AnyhowResult<CryptedCookie> {
    let cookie_version = COOKIE_VERSION.to_string();

    let mut claims = BTreeMap::new();
    claims.insert("session_token".to_string(), session_token.to_string());
    claims.insert("user_token".to_string(), user_token.to_string());
    claims.insert("cookie_version".to_string(), cookie_version);

    let crypt_cookie = self.ccm.encrypt_map_to_cookie(claims, SESSION_COOKIE_NAME)?;

    Ok(crypt_cookie)
  }

  pub fn delete_cookie(&self) -> Cookie {
    Cookie::build(SESSION_COOKIE_NAME, "DELETED")
      .expires(OffsetDateTime::unix_epoch())
      .finish()
  }

  pub fn decode_session_cookie_payload(&self, session_cookie: &CryptedCookie)
    -> AnyhowResult<SessionCookiePayload>
  {

    let claims: BTreeMap<String, String> = self.ccm.decrypt_cookie_to_map(session_cookie)?;

    let session_token = claims["session_token"].clone();
    let maybe_user_token = claims.get("user_token")
        .map(|t| t.to_string());

    Ok(SessionCookiePayload {
      session_token: session_token.to_string(),
      maybe_user_token,
    })
  }

  pub fn decode_session_payload_from_request(&self, request: &HttpRequest)
    -> AnyhowResult<Option<SessionCookiePayload>>
  {
    let cookie = match request.cookie(SESSION_COOKIE_NAME) {
      None => return Ok(None),
      Some(cookie) => CryptedCookie(cookie),
    };

    match self.decode_session_cookie_payload(&cookie) {
      Err(e) => {
        warn!("Session cookie decode error: {:?}", e);
        Err(anyhow!("Could not decode session cookie: {:?}", e))
      },
      Ok(payload) => Ok(Some(payload)),
    }
  }

  pub fn decode_session_token(&self, session_cookie: &CryptedCookie) -> AnyhowResult<String> {
    let cookie_payload =
        self.decode_session_cookie_payload(session_cookie)?;
    Ok(cookie_payload.session_token)
  }

  pub fn decode_session_token_from_request(&self, request: &HttpRequest)
    -> AnyhowResult<Option<String>>
  {
    let cookie = match request.cookie(SESSION_COOKIE_NAME) {
      None => return Ok(None),
      Some(cookie) => CryptedCookie(cookie),
    };

    match self.decode_session_token(&cookie) {
      Err(e) => {
        warn!("Session cookie decode error: {:?}", e);
        Err(anyhow!("Could not decode session cookie: {:?}", e))
      },
      Ok(session_token) => Ok(Some(session_token)),
    }
  }
}

