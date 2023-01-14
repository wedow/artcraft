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
pub struct GetTtsInferenceQueueCountResponse {
  pub success: bool,
  // Seconds since job at head of queue was enqueued (proxy for queue wait time)
  pub seconds_since_first: i64,

  // All "pending" jobs
  pub pending_count: i64,

  // All "pending" jobs with priority > 0
  pub pending_priority_nonzero_count: i64,

  // All "pending" jobs with priority > 1
  pub pending_priority_gt_one_count: i64,

  // Failed, but not permanently dead
  pub attempt_failed_count: i64,
}

#[derive(Debug, Serialize)]
pub enum GetTtsInferenceQueueCountError {
  ServerError,
  Unauthorized,
}

impl ResponseError for GetTtsInferenceQueueCountError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetTtsInferenceQueueCountError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetTtsInferenceQueueCountError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for GetTtsInferenceQueueCountError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_tts_inference_queue_count_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetTtsInferenceQueueCountError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetTtsInferenceQueueCountError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(GetTtsInferenceQueueCountError::Unauthorized);
    }
  };

  // TODO: Not a good fit for this permission.
  if !user_session.can_ban_users {
    warn!("user is not allowed to view bans: {}", user_session.user_token);
    return Err(GetTtsInferenceQueueCountError::Unauthorized);
  }

  // NB(old?): Lookup failure is Err(RowNotFound).
  // NB(2022-03-05): The "seconds_since_first" result might return null if no pending, so IFNULL
  //  means we won't fail the full query.
  let maybe_result = sqlx::query_as!(
      PendingCountResult,
        r#"
SELECT
  IFNULL((
    SELECT
      NOW() - t1.created_at AS seconds_since_first
    FROM tts_inference_jobs AS t1
    WHERE t1.status = "pending"
    ORDER BY t1.id ASC
    LIMIT 1
  ), 0) as seconds_since_first,
  sub2.pending_count,
  sub3.pending_priority_nonzero_count,
  sub4.pending_priority_gt_one_count,
  sub5.attempt_failed_count
FROM
  (
    SELECT
      count(t2.id) as pending_count
    FROM tts_inference_jobs AS t2
    WHERE t2.status = "pending"
  ) as sub2,
  (
    SELECT
      count(t3.id) as pending_priority_nonzero_count
    FROM tts_inference_jobs AS t3
    WHERE t3.status = "pending"
    AND t3.priority_level > 0
  ) as sub3,
  (
    SELECT
      count(t4.id) as pending_priority_gt_one_count
    FROM tts_inference_jobs AS t4
    WHERE t4.status = "pending"
    AND t4.priority_level > 1
  ) as sub4,
  (
    SELECT
      count(t5.id) as attempt_failed_count
    FROM tts_inference_jobs AS t5
    WHERE t5.status = "attempt_failed"
  ) as sub5
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
            seconds_since_first: 0,
            pending_count: 0,
            pending_priority_nonzero_count: 0,
            pending_priority_gt_one_count: 0,
            attempt_failed_count: 0,
          }
        },
        _ => {
          warn!("get tts pending count error: {:?}", err);
          return Err(GetTtsInferenceQueueCountError::ServerError)
        }
      }
    },
  };

  println!("Foo: {:?}",  &result);

  let response = GetTtsInferenceQueueCountResponse {
    success: true,
    seconds_since_first: result.seconds_since_first,
    pending_count: result.pending_count,
    pending_priority_nonzero_count: result.pending_priority_nonzero_count,
    pending_priority_gt_one_count: result.pending_priority_gt_one_count,
    attempt_failed_count: result.attempt_failed_count,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetTtsInferenceQueueCountError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

#[derive(Serialize, Debug)]
pub struct PendingCountResult {
  pub seconds_since_first: i64,
  pub pending_count: i64,
  pub pending_priority_nonzero_count: i64,
  pub pending_priority_gt_one_count: i64,
  pub attempt_failed_count: i64,
}
