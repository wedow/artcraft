use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use log::{error, warn};
use utoipa::ToSchema;

use mysql_queries::queries::generic_inference::web::dismiss_finished_jobs_for_user::dismiss_finished_jobs_for_user;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_cancelled_by_user::mark_generic_inference_job_cancelled_by_user;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct DismissFinishedSessionJobsSuccessResponse {
  pub success: bool,
}

#[derive(Debug, ToSchema)]
pub enum DismissFinishedSessionJobsError {
  ServerError,
  NotFound,
  NotAuthorized,
}

impl ResponseError for DismissFinishedSessionJobsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DismissFinishedSessionJobsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      DismissFinishedSessionJobsError::NotFound => StatusCode::NOT_FOUND,
      DismissFinishedSessionJobsError::NotAuthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      Self::ServerError => "server error".to_string(),
      Self::NotFound => "not found".to_string(),
      Self::NotAuthorized => "unauthorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DismissFinishedSessionJobsError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Mark all jobs that are finished (or that failed completely and will not retry) as dismissed.
///
/// This will prevent these jobs from being returned in the "list session jobs" endpoint.
#[utoipa::path(
  post,
  tag = "Jobs",
  path = "/v1/jobs/session/dismiss_finished",
  responses(
    (status = 200, body = DismissFinishedSessionJobsSuccessResponse),
    (status = 500, body = DismissFinishedSessionJobsError),
  ),
)]
pub async fn dismiss_finished_session_jobs_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, DismissFinishedSessionJobsError>
{
  // TODO(bt,2024-06-16): Reuse connection
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        DismissFinishedSessionJobsError::ServerError
      })?;

  let user_session = require_user_session(&http_request, &server_state)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DismissFinishedSessionJobsError::ServerError
      })?;

  dismiss_finished_jobs_for_user(&mut mysql_connection, &user_session.user_token)
      .await
      .map_err(|err| {
        error!("tts job query error: {:?}", err);
        DismissFinishedSessionJobsError::ServerError
      })?;

  let response = DismissFinishedSessionJobsSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| {
        error!("error returning response: {:?}",  e);
        DismissFinishedSessionJobsError::ServerError
      })?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
