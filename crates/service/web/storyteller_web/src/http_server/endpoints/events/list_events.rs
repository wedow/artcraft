use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest, HttpMessage};
use chrono::{DateTime, Utc};
use crate::AnyhowResult;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;
use derive_more::{Display, Error};
use log::{info, warn, log};
use regex::Regex;
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::sync::Arc;

#[derive(Serialize)]
pub struct EventRecord {
  pub event_token: String,
  pub event_type: String,
  pub maybe_target_user_token: Option<String>,
  pub maybe_target_username: Option<String>,
  pub maybe_target_display_name: Option<String>,
  pub maybe_target_user_gravatar_hash: Option<String>,
  pub maybe_target_entity_token: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct ListEventsSuccessResponse {
  pub success: bool,
  pub events: Vec<EventRecord>,
}

#[derive(Debug, Display)]
pub enum ListEventsError {
  ServerError,
}

impl ResponseError for ListEventsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListEventsError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListEventsError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

pub async fn list_events_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListEventsError> {
  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_events = sqlx::query_as!(
      EventRecord,
        r#"
SELECT
    events.token as event_token,
    events.event_type,
    events.maybe_target_user_token,
    users.username as maybe_target_username,
    users.display_name as maybe_target_display_name,
    users.email_gravatar_hash as maybe_target_user_gravatar_hash,
    events.maybe_target_entity_token,
    events.created_at,
    events.updated_at
FROM firehose_entries as events
LEFT OUTER JOIN users
ON events.maybe_target_user_token = users.token
ORDER BY events.id DESC
LIMIT 25
        "#,
    )
    .fetch_all(&server_state.mysql_pool)
    .await;

  let events : Vec<EventRecord> = match maybe_events {
    Ok(events) => events,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          return Err(ListEventsError::ServerError);
        },
        _ => {
          warn!("tts models list query error: {:?}", err);
          return Err(ListEventsError::ServerError);
        }
      }
    }
  };

  let response = ListEventsSuccessResponse {
    success: true,
    events,
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| ListEventsError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
