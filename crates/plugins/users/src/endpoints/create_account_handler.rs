// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpResponse, HttpRequest};
use crate::utils::email_to_gravatar::email_to_gravatar;
use crate::utils::session_cookie_manager::SessionCookieManager;
use crate::validations::is_reserved_username::is_reserved_username;
use crate::validations::validate_passwords::validate_passwords;
use crate::validations::validate_username::validate_username;
use database_queries::mediators::firehose_publisher::FirehosePublisher;
use database_queries::queries::users::user::create_account::{create_account, CreateAccountArgs, CreateAccountError};
use database_queries::queries::users::user_sessions::create_user_session::create_user_session;
use database_queries::tokens::Tokens;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn};
use sqlx::MySqlPool;
use std::collections::HashMap;
use std::fmt::Formatter;
use std::fmt;
use user_input_common::check_for_slurs::contains_slurs;

#[derive(Deserialize)]
pub struct CreateAccountRequest {
  pub username: String,
  pub password: String,
  pub password_confirmation: String,
  pub email_address: String,
}

#[derive(Serialize)]
pub struct CreateAccountSuccessResponse {
  pub success: bool,
}

#[derive(Serialize, Debug)]
pub struct CreateAccountErrorResponse {
  pub success: bool,
  pub error_type: CreateAccountErrorType,
  pub error_fields: HashMap<String, String>,
}

#[derive(Copy, Clone, Debug, Serialize)]
pub enum CreateAccountErrorType {
  BadInput,
  EmailTaken,
  ServerError,
  UsernameReserved,
  UsernameTaken,
}

impl CreateAccountErrorResponse {
  fn server_error() -> Self {
    Self {
      success: false,
      error_type: CreateAccountErrorType::ServerError,
      error_fields: HashMap::new(),
    }
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for CreateAccountErrorResponse {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self.error_type)
  }
}

impl ResponseError for CreateAccountErrorResponse {
  fn status_code(&self) -> StatusCode {
    match self.error_type {
      CreateAccountErrorType::BadInput => StatusCode::BAD_REQUEST,
      CreateAccountErrorType::EmailTaken => StatusCode::BAD_REQUEST,
      CreateAccountErrorType::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      CreateAccountErrorType::UsernameReserved => StatusCode::BAD_REQUEST,
      CreateAccountErrorType::UsernameTaken => StatusCode::BAD_REQUEST,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

pub async fn create_account_handler(
  http_request: HttpRequest,
  request: web::Json<CreateAccountRequest>,
  mysql_pool: web::Data<MySqlPool>,
  session_cookie_manager: web::Data<SessionCookieManager>,
  firehose_publisher: web::Data<FirehosePublisher>,
) -> Result<HttpResponse, CreateAccountErrorResponse>
{
  let mut error_fields = HashMap::new();

  if let Err(reason) = validate_username(&request.username) {
    error_fields.insert("username".to_string(), reason);
  }

  if let Err(reason) = validate_passwords(&request.password, &request.password_confirmation) {
    error_fields.insert("password".to_string(), reason);
  }

  if contains_slurs(&request.username) {
    error_fields.insert("username".to_string(), "username contains slurs".to_string());
  }

  if !request.email_address.contains("@") {
    error_fields.insert("email_address".to_string(), "invalid email address".to_string());
  }

  if is_reserved_username(&request.username) {
    error_fields.insert("username".to_string(), "username is reserved".to_string());

    return Err(CreateAccountErrorResponse {
      success: false,
      error_type: CreateAccountErrorType::UsernameReserved,
      error_fields
    });
  }

  if !error_fields.is_empty() {
    return Err(CreateAccountErrorResponse {
      success: false,
      error_type: CreateAccountErrorType::BadInput,
      error_fields
    });
  }

  let user_token = Tokens::new_user()
    .map_err(|e| {
      warn!("Bad crockford token: {:?}", e);
      CreateAccountErrorResponse::server_error()
    })?;

  let password_hash = match bcrypt::hash(&request.password, bcrypt::DEFAULT_COST) {
    Ok(hash) => hash,
    Err(err) => {
      warn!("Bcrypt error: {:?}", err);
      return Err(CreateAccountErrorResponse::server_error());
    }
  };

  let username = request.username.trim().to_lowercase();

  let display_name = request.username.trim().to_string();

  let email_address = request.email_address.trim().to_lowercase();

  let email_gravatar_hash = email_to_gravatar(&email_address);

  let ip_address = get_request_ip(&http_request);

  let create_account_result = create_account(
    &mysql_pool,
    CreateAccountArgs {
      username: &username,
      display_name: &display_name,
      email_address: &email_address,
      email_gravatar_hash: &email_gravatar_hash,
      password_hash: &password_hash,
      ip_address: &ip_address,
    }
  ).await;

  let new_user_data = match create_account_result {
    Ok(success) => success,
    Err(err) => {
      let mut error_fields = HashMap::new();
      let error_type;

      match err {
        CreateAccountError::EmailIsTaken => {
          error_type = CreateAccountErrorType::EmailTaken;
          error_fields.insert("email_address".to_string(), "email is taken".to_string());
        }
        CreateAccountError::UsernameIsTaken => {
          error_type = CreateAccountErrorType::UsernameTaken;
          error_fields.insert("username".to_string(), "username is taken".to_string());
        }
        CreateAccountError::DatabaseError | CreateAccountError::OtherError => {
          error_type = CreateAccountErrorType::ServerError;
        }
      }

      return Err(CreateAccountErrorResponse {
        success: false,
        error_type,
        error_fields
      });
    }
  };

  info!("new user id: {}", new_user_data.user_id);

  let create_session_result = create_user_session(
    &new_user_data.user_token,
    &ip_address,
    &mysql_pool
  ).await;

  let session_token = match create_session_result {
    Ok(token) => token,
    Err(e) => {
      warn!("create account session creation error : {:?}", e);
      return Err(CreateAccountErrorResponse::server_error());
    }
  };

  info!("new user session created");

  firehose_publisher.publish_user_sign_up(&user_token)
    .await
    .map_err(|e| {
      warn!("error publishing event: {:?}", e);
      CreateAccountErrorResponse::server_error()
    })?;

  let session_cookie = match session_cookie_manager.create_cookie(&session_token, &user_token) {
    Ok(cookie) => cookie,
    Err(_) => return Err(CreateAccountErrorResponse::server_error()),
  };

  let response = CreateAccountSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| CreateAccountErrorResponse::server_error())?;

  Ok(HttpResponse::Ok()
    .cookie(session_cookie.0)
    .content_type("application/json")
    .body(body))
}
