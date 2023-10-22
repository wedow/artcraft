/* 
    ~ B R A I N S T O R M ~

    - redeem reset request
        - needs a way to identify the user because only the tuple is unique (user + key)
            username or email address
        - provide new password
 */

use std::fmt::Display;

use actix_web::http::StatusCode;
use actix_web::{HttpRequest, HttpResponse, web, ResponseError};
use byteorder::ByteOrder;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::warn;
use mysql_queries::queries::users::user::create_password_reset_request::create_password_reset;
use mysql_queries::queries::users::user::lookup_user_for_login_by_email::lookup_user_for_login_by_email;
use mysql_queries::queries::users::user::lookup_user_for_login_by_username::lookup_user_for_login_by_username;
use rand::RngCore;
use serde::Deserialize;
use sqlx::MySqlPool;
use strum_macros::Display;

/// This can be reused in login requests in the future!
#[derive(Deserialize)]
pub enum UserLogin {
    Email(String),
    Username(String),
}

#[derive(Deserialize)]
pub struct PasswordResetRequest {
    login: UserLogin,
}

#[derive(Serialize)]
pub struct PasswordResetResponse {}

#[derive(Serialize, Debug, Display)]
pub enum PasswordResetRequestError {
    NoSuchUser,
    Internal,
}

#[derive(Serialize, Debug)]
pub struct PasswordResetErrorResponse {
    kind: PasswordResetRequestError,
}
impl Display for PasswordResetErrorResponse {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl From<PasswordResetRequestError> for PasswordResetErrorResponse {
    fn from(value: PasswordResetRequestError) -> Self {
        Self { kind: value }
    }
}
impl From<errors::AnyhowError> for PasswordResetErrorResponse {
    fn from(value: errors::AnyhowError) -> Self {
        log::error!("Internal error: {value}");
        Self { kind: PasswordResetRequestError::Internal }
    }
}

impl ResponseError for PasswordResetErrorResponse {
    //TODO: Yknow, clean this up and stuff
    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }
  
    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
  }

/// 
/// Non-authenticated!
/// 
/// - create password reset request
///     - sends email?
///     - inserts record and stuff
pub async fn password_reset_request_handler(
    http_request: HttpRequest,
    request: web::Json<PasswordResetRequest>,
    // session_cookie_manager: web::Data<SessionCookieManager>,
    mysql_pool: web::Data<MySqlPool>,
) -> Result<HttpResponse, PasswordResetErrorResponse> {

    let ip_address = get_request_ip(&http_request);

    let user = match &request.login { 
        UserLogin::Email(email) => lookup_user_for_login_by_email(&email, &mysql_pool).await,
        UserLogin::Username(username) => lookup_user_for_login_by_username(&username, &mysql_pool).await,
    }.map_err(|e| {
        warn!("Password reset user lookup: {:?}", e);
        PasswordResetRequestError::NoSuchUser
        //TODO: This could be anything, not necessarily a lookup.  The name is misleading 🤷🏻
    })?;

    let mut rng = rand::thread_rng();
    let mut secret_key_bytes =  [0u8;40];
                                        // Has to fit within (4 / 3) * string length (32 chars),
                                        // but also be a multiple of 8 so we can read them as `u64`s
                                        // (for Crockford)
    rng.fill_bytes(&mut secret_key_bytes);

    let mut secret_key = String::new();
    secret_key_bytes.chunks_exact(8)
        .map(|chunk| byteorder::LittleEndian::read_u64(chunk))
        .for_each(|chunk| crockford::encode_into::<String>(chunk, &mut secret_key));

    secret_key.truncate(32);


    //TODO: Handle banned users, they shouldn't be able to do this

    create_password_reset(&mysql_pool, &user, ip_address, secret_key.clone()).await
    .map_err(|err| {
        log::error!("AAAAAHHH! {:?}", err);
        err
    })?;
    email::send_password_reset(&user.email_address, secret_key).await?;

    Ok(HttpResponse::Ok().finish())
}