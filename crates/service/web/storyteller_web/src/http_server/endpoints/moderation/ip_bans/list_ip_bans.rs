use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::Path;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use chrono::{DateTime, Utc};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use crate::validations::model_uploads::validate_model_title;
use derive_more::{Display, Error};
use log::{info, warn, log};
use regex::Regex;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::sync::Arc;

#[derive(Serialize)]
pub struct ListIpBansResponse {
  pub success: bool,
  pub ip_address_bans: Vec<IpBanRecordForList>,
}

#[derive(Serialize)]
pub struct IpBanRecordForList {
  pub ip_address: String,
  pub maybe_target_user_token: Option<String>,
  pub maybe_target_username: Option<String>,
  pub mod_user_token: String,
  pub mod_username: String,
  pub mod_display_name: String,
  pub mod_notes: String,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Display)]
pub enum ListIpBansError {
  BadInput(String),
  ServerError,
  Unauthorized,
}

impl ResponseError for ListIpBansError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListIpBansError::BadInput(_) => StatusCode::BAD_REQUEST,
      ListIpBansError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      ListIpBansError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListIpBansError::BadInput(reason) => reason.to_string(),
      ListIpBansError::ServerError => "server error".to_string(),
      ListIpBansError::Unauthorized => "unauthorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

pub async fn list_ip_bans_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListIpBansError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListIpBansError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(ListIpBansError::Unauthorized);
    }
  };

  if !user_session.can_ban_users {
    warn!("user is not allowed to see bans: {}", user_session.user_token);
    return Err(ListIpBansError::Unauthorized);
  }

  // NB: Lookup failure is Err(RowNotFound).
  let maybe_results = sqlx::query_as!(
      IpBanRecordForList,
        r#"
SELECT
    ip_bans.ip_address,

    ip_bans.maybe_target_user_token,
    banned_users.username as maybe_target_username,

    ip_bans.mod_user_token,
    mod_users.username as mod_username,
    mod_users.display_name as mod_display_name,

    ip_bans.mod_notes,
    ip_bans.created_at,
    ip_bans.updated_at
FROM
    ip_address_bans AS ip_bans
LEFT OUTER JOIN users as banned_users
    ON ip_bans.maybe_target_user_token = banned_users.token
JOIN users as mod_users
    ON ip_bans.mod_user_token = mod_users.token
WHERE
    ip_bans.deleted_at IS NULL
        "#,
    )
      .fetch_all(&server_state.mysql_pool)
      .await;

  let results : Vec<IpBanRecordForList> = match maybe_results {
    Ok(results) => {
      info!("Results length: {}", results.len());
      results
    },
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          Vec::new()
        },
        _ => {
          warn!("list ip bans db error: {:?}", err);
          return Err(ListIpBansError::ServerError);
        }
      }
    }
  };

  let response = ListIpBansResponse {
    success: true,
    ip_address_bans: results,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListIpBansError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
