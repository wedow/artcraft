use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::Path;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use chrono::{DateTime, Utc};
use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::server_state::ServerState;
use log::{info, warn, log};
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

#[derive(Serialize)]
pub struct GetPendingW2lTemplatesResponse {
  pub success: bool,
  pub templates: Vec<PendingW2lTemplate>,
}

#[derive(Serialize)]
pub struct PendingW2lTemplate {
  pub template_token: String,
  pub title: String,
  pub template_type: String,
  pub duration_millis: i32,
  pub frame_width: i32,
  pub frame_height: i32,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
  pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub enum GetPendingW2lTemplatesError {
  ServerError,
  Unauthorized,
}

impl ResponseError for GetPendingW2lTemplatesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetPendingW2lTemplatesError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetPendingW2lTemplatesError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for GetPendingW2lTemplatesError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_pending_w2l_templates_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetPendingW2lTemplatesError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetPendingW2lTemplatesError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(GetPendingW2lTemplatesError::Unauthorized);
    }
  };

  if !user_session.can_approve_w2l_templates {
    warn!("user is not allowed to approve w2l templates: {}", user_session.user_token);
    return Err(GetPendingW2lTemplatesError::Unauthorized);
  }

  // NB: Lookup failure is Err(RowNotFound).
  let maybe_results = sqlx::query_as!(
      PendingW2lTemplatesRaw,
        r#"
SELECT
  w2l_templates.token as template_token,
  w2l_templates.title,
  w2l_templates.template_type,
  w2l_templates.duration_millis,
  w2l_templates.frame_width,
  w2l_templates.frame_height,
  w2l_templates.creator_user_token,
  users.username AS creator_username,
  users.display_name AS creator_display_name,
  users.email_gravatar_hash AS creator_gravatar_hash,
  w2l_templates.created_at
FROM
  w2l_templates
JOIN
  users
ON
  users.token = w2l_templates.creator_user_token
WHERE
  w2l_templates.is_public_listing_approved IS NULL
  AND w2l_templates.user_deleted_at IS NULL
  AND w2l_templates.mod_deleted_at IS NULL
  AND w2l_templates.is_locked_from_use IS FALSE
        "#,
    )
      .fetch_all(&server_state.mysql_pool)
      .await;

  let results : Vec<PendingW2lTemplatesRaw> = match maybe_results {
    Ok(results) => results,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          Vec::new()
        },
        _ => {
          warn!("list pending w2l db error: {:?}", err);
          return Err(GetPendingW2lTemplatesError::ServerError)
        }
      }
    }
  };

  let results = results.iter().map(|r| {
    PendingW2lTemplate {
      template_token: r.template_token.clone(),
      title: r.title.clone(),
      template_type: r.template_type.clone(),
      duration_millis: r.duration_millis,
      frame_width: r.frame_width,
      frame_height: r.frame_height,
      creator_user_token: r.creator_user_token.clone(),
      creator_username: r.creator_username.clone(),
      creator_display_name: r.creator_display_name.clone(),
      creator_gravatar_hash: r.creator_gravatar_hash.clone(),
      created_at: r.created_at.clone(),
    }
  }).collect::<Vec<PendingW2lTemplate>>();

  let response = GetPendingW2lTemplatesResponse {
    success: true,
    templates: results,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetPendingW2lTemplatesError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

#[derive(Serialize)]
pub struct PendingW2lTemplatesRaw {
  pub template_token: String,
  pub title: String,
  pub template_type: String,
  pub duration_millis: i32,
  pub frame_width: i32,
  pub frame_height: i32,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
  pub created_at: DateTime<Utc>,
}
