use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::Path;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use chrono::{DateTime, Utc};
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::server_state::ServerState;
use log::{info, warn, log};
use regex::Regex;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

#[derive(Serialize)]
pub struct GetW2lInferenceQueueCountResponse {
  pub success: bool,
  pub pending_count: i64,
  pub seconds_since_first: i64,
}

#[derive(Debug, Serialize)]
pub enum GetW2lInferenceQueueCountError {
  ServerError,
  Unauthorized,
}

impl ResponseError for GetW2lInferenceQueueCountError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetW2lInferenceQueueCountError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetW2lInferenceQueueCountError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for GetW2lInferenceQueueCountError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_w2l_inference_queue_count_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetW2lInferenceQueueCountError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetW2lInferenceQueueCountError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(GetW2lInferenceQueueCountError::Unauthorized);
    }
  };

  // TODO: Not a good fit for this permission.
  if !user_session.can_ban_users {
    warn!("user is not allowed to view bans: {}", user_session.user_token);
    return Err(GetW2lInferenceQueueCountError::Unauthorized);
  }

  // NB: Lookup failure is Err(RowNotFound).
  let maybe_result = sqlx::query_as!(
      PendingCountResult,
        r#"
SELECT
  NOW() - t2.created_at AS seconds_since_first,
  (
    SELECT
      count(t1.id) as pending_count
    FROM w2l_inference_jobs AS t1
    WHERE t1.status = "pending"
  ) as pending_count
FROM w2l_inference_jobs AS t2
WHERE t2.status = "pending"
ORDER BY t2.id ASC
LIMIT 1
        "#,
    )
      .fetch_one(&server_state.mysql_pool)
      .await;

  let result : PendingCountResult = match maybe_result {
    Ok(result) => result,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          // NB: Not Found for null results means nothing is pending in the queue
          PendingCountResult {
            pending_count: None,
            seconds_since_first: 0,
          }
        },
        _ => {
          warn!("get w2l pending count error: {:?}", err);
          return Err(GetW2lInferenceQueueCountError::ServerError)
        }
      }
    },
  };

  let response = GetW2lInferenceQueueCountResponse {
    success: true,
    pending_count: result.pending_count.unwrap_or(0),
    seconds_since_first: result.seconds_since_first,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetW2lInferenceQueueCountError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

#[derive(Serialize)]
pub struct PendingCountResult {
  pub pending_count: Option<i64>,
  pub seconds_since_first: i64,
}
