// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use log::warn;
use sqlx::MySqlPool;

use http_server_common::response::response_error_helpers::to_simple_json_error;
use mysql_queries::queries::users::user_sessions::delete_user_session::delete_user_session;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;

use crate::cookies::session::session_cookie_manager::SessionCookieManager;

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
  session_cookie_manager: web::Data<SessionCookieManager>,
  mysql_pool: web::Data<MySqlPool>,
  internal_session_cache_purge: web::Data<dyn InternalSessionCachePurge>,
) -> Result<HttpResponse, LogoutError>
{
  // Best effort to delete Redis session cache
  internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  let mut delete_cookie = match http_request.cookie("session") {
    Some(cookie) => {
      match session_cookie_manager.decode_session_token(&cookie) {
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

  // Mark cookie for deletion
  delete_cookie.make_removal();

  Ok(HttpResponse::Ok()
    .cookie(delete_cookie)
    .content_type("application/json")
    .body(body))
}
