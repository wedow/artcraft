// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpResponse, HttpRequest};
use crate::utils::crypted_cookie_manager::CryptedCookie;
use crate::utils::session_cookie_manager::SessionCookieManager;
use database_queries::queries::users::user_sessions::delete_user_session::delete_user_session;
use http_server_common::response::response_error_helpers::to_simple_json_error;
use log::warn;
use sqlx::MySqlPool;
use std::fmt;

#[derive(Serialize)]
pub struct LogoutSuccessResponse {
  pub success: bool,
}

#[derive(Debug)]
pub enum LogoutError {
  ServerError,
}

impl ResponseError for LogoutError {
  fn status_code(&self) -> StatusCode {
    match *self {
      LogoutError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      LogoutError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for LogoutError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn logout_handler(
  http_request: HttpRequest,
  session_cookie_manager: web::Data<SessionCookieManager<'_>>,
  mysql_pool: web::Data<MySqlPool>,
) -> Result<HttpResponse, LogoutError>
{
  let delete_cookie = match http_request.cookie("session") {
    Some(cookie) => {
      match session_cookie_manager.decode_session_token(&CryptedCookie(cookie.clone())) {
        Err(e) => {
          warn!("Session cookie decode error: {:?}", e);
        },
        Ok(session_token) => {
          let _r = delete_user_session(&session_token, &mysql_pool).await;
        }
      }

      cookie // delete this cookie
    },
    None => {
      session_cookie_manager.delete_cookie()
    }
  };

  let response = LogoutSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| LogoutError::ServerError)?;

  Ok(HttpResponse::Ok()
    .del_cookie(&delete_cookie)
    .content_type("application/json")
    .body(body))
}
