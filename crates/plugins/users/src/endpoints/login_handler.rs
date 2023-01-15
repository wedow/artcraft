// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpResponse, HttpRequest};
use crate::utils::session_cookie_manager::SessionCookieManager;
use database_queries::helpers::boolean_converters::i8_to_bool;
use database_queries::queries::users::user_sessions::create_user_session::create_user_session;
use database_queries::queries::users::user::lookup_user_for_login_by_email::lookup_user_for_login_by_email;
use database_queries::queries::users::user::lookup_user_for_login_by_username::lookup_user_for_login_by_username;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn};
use sqlx::MySqlPool;
use std::fmt::Formatter;
use std::fmt;

#[derive(Deserialize)]
pub struct LoginRequest {
  pub username_or_email: String,
  pub password: String,
}

#[derive(Serialize)]
pub struct LoginSuccessResponse {
  pub success: bool,
}

#[derive(Serialize, Debug)]
pub struct LoginErrorResponse {
  pub success: bool,
  pub error_type: LoginErrorType,
  pub error_message: String,
}

#[derive(Copy, Clone, Debug, Serialize)]
pub enum LoginErrorType {
  InvalidCredentials,
  ServerError,
}

impl LoginErrorResponse {
  fn invalid_credentials() -> Self {
    Self {
      success: false,
      error_type: LoginErrorType::InvalidCredentials,
      error_message: "invalid credentials".to_string()
    }
  }
  fn server_error() -> Self {
    Self {
      success: false,
      error_type: LoginErrorType::ServerError,
      error_message: "server error".to_string()
    }
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for LoginErrorResponse {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self.error_type)
  }
}

impl ResponseError for LoginErrorResponse {
  fn status_code(&self) -> StatusCode {
    match self.error_type {
      LoginErrorType::InvalidCredentials => StatusCode::UNAUTHORIZED,
      LoginErrorType::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

pub async fn login_handler(
  http_request: HttpRequest,
  request: web::Json<LoginRequest>,
  session_cookie_manager: web::Data<SessionCookieManager>,
  mysql_pool: web::Data<MySqlPool>,
) -> Result<HttpResponse, LoginErrorResponse>
{
  let check_username_or_email = request.username_or_email.to_lowercase();

  let maybe_user = if check_username_or_email.contains("@") {
    lookup_user_for_login_by_email(&check_username_or_email, &mysql_pool).await
  } else {
    lookup_user_for_login_by_username(&check_username_or_email, &mysql_pool).await
  };

  let user = match maybe_user {
    Ok(user) => user,
    Err(e) =>  {
      // TODO: This isn't necessarily user error. I need to fix the above code to not lose error
      //  semantics. I also need to prevent user lookup attacks.
      warn!("Login lookup error: {:?}", e);
      return Err(LoginErrorResponse::invalid_credentials());
    }
  };

  let is_banned = i8_to_bool(user.is_banned);
  if is_banned {
    // We don't allow banned users back in.
    return Err(LoginErrorResponse::invalid_credentials());
  }

  info!("login user found");

  let actual_hash = match String::from_utf8(user.password_hash.clone()) {
    Ok(hash) => hash,
    Err(e) => {
      warn!("Login hash hydration error: {:?}", e);
      return Err(LoginErrorResponse::server_error());
    }
  };

  match bcrypt::verify(&request.password, &actual_hash) {
    Err(e) => {
      warn!("Login hash comparison error: {:?}", e);
      return Err(LoginErrorResponse::server_error());
    }
    Ok(is_valid) => {
      if !is_valid {
        info!("invalid credentials");
        return Err(LoginErrorResponse::invalid_credentials());
      }
      // Good to go...!
    },
  };

  let ip_address = get_request_ip(&http_request);

  let create_session_result =
    create_user_session(&user.token.0, &ip_address, &mysql_pool).await;

  let session_token = match create_session_result {
    Ok(token) => token,
    Err(e) => {
      warn!("login create session error : {:?}", e);
      return Err(LoginErrorResponse::server_error());
    }
  };

  info!("login session created for user: {} / {:?}", &user.token, &user.token);

  let session_cookie = match session_cookie_manager.create_cookie(&session_token, &user.token.0) {
    Ok(cookie) => cookie,
    Err(_) => return Err(LoginErrorResponse::server_error()),
  };

  let response = LoginSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| LoginErrorResponse::server_error())?;

  Ok(HttpResponse::Ok()
    .cookie(session_cookie.0)
    .content_type("application/json")
    .body(body))
}
