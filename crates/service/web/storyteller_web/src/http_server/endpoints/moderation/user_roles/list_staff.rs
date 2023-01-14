use actix_http::Error;
use actix_web::http::header;
use actix_web::cookie::Cookie;
use actix_web::HttpResponseBuilder;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
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
pub struct ListStaffResponse {
  pub success: bool,
  pub staff: Vec<StaffRecordForList>,
}

#[derive(Serialize)]
pub struct StaffRecordForList {
  pub user_token: String,
  pub username: String,
  pub display_name: String,
  pub user_role_slug: String,
  pub user_role_name: String,
}

#[derive(Debug, Display)]
pub enum ListStaffError {
  BadInput(String),
  ServerError,
  Unauthorized,
}

impl ResponseError for ListStaffError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListStaffError::BadInput(_) => StatusCode::BAD_REQUEST,
      ListStaffError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      ListStaffError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListStaffError::BadInput(reason) => reason.to_string(),
      ListStaffError::ServerError => "server error".to_string(),
      ListStaffError::Unauthorized => "unauthorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

pub async fn list_staff_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListStaffError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListStaffError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(ListStaffError::Unauthorized);
    }
  };

  // TODO: This is not the correct permission.
  if !user_session.can_ban_users {
    warn!("user is not allowed to delete bans: {}", user_session.user_token);
    return Err(ListStaffError::Unauthorized);
  }

  // NB: Lookup failure is Err(RowNotFound).
  let maybe_results = sqlx::query_as!(
      StaffRecordForList,
        r#"
SELECT
    users.token as user_token,
    users.username,
    users.display_name,
    user_roles.slug as user_role_slug,
    user_roles.name as user_role_name
FROM
    users
JOIN user_roles
    ON users.user_role_slug = user_roles.slug
WHERE
    user_roles.slug != 'user'
        "#,
    )
      .fetch_all(&server_state.mysql_pool)
      .await;

  let results : Vec<StaffRecordForList> = match maybe_results {
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
          warn!("list staff db error: {:?}", err);
          return Err(ListStaffError::ServerError);
        }
      }
    }
  };

  let response = ListStaffResponse {
    success: true,
    staff: results,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListStaffError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
