use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use log::warn;

use mysql_queries::queries::w2l::w2l_results::query_w2l_result::select_w2l_result_by_token;
use mysql_queries::queries::w2l::w2l_results::query_w2l_result::W2lResultRecordForResponse;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetW2lResultPathInfo {
  token: String,
}

#[derive(Serialize)]
pub struct GetW2lResultSuccessResponse {
  pub success: bool,
  pub result: W2lResultRecordForResponse,
}

#[derive(Debug)]
pub enum GetW2lResultError {
  ServerError,
  NotFound,
}

impl ResponseError for GetW2lResultError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetW2lResultError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetW2lResultError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetW2lResultError::ServerError => "server error".to_string(),
      GetW2lResultError::NotFound => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetW2lResultError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_w2l_inference_result_handler(
  http_request: HttpRequest,
  path: Path<GetW2lResultPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetW2lResultError> {
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetW2lResultError::ServerError
      })?;

  let mut show_deleted_results = false;
  let mut is_moderator = false;

  if let Some(user_session) = maybe_user_session {
    // NB: Moderators can see deleted results.
    // Original creators cannot see them (unless they're moderators!)
    show_deleted_results = user_session.can_delete_other_users_w2l_results;
    // Moderators get to see all the fields.
    is_moderator = user_session.can_delete_other_users_w2l_results
        || user_session.can_edit_other_users_w2l_templates;
  }

  let inference_result_query_result = select_w2l_result_by_token(
    &path.token,
    show_deleted_results,
    &server_state.mysql_pool
  ).await;

  let mut inference_result = match inference_result_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(GetW2lResultError::ServerError);
    }
    Ok(None) => return Err(GetW2lResultError::NotFound),
    Ok(Some(inference_result)) => inference_result,
  };

  if let Some(moderator_fields) = inference_result.maybe_moderator_fields.as_ref() {
    // NB: The moderator fields will always be present before removal
    // We don't want non-mods seeing stuff made by banned users.
    if (moderator_fields.template_creator_is_banned || moderator_fields.result_creator_is_banned_if_user)
        && !is_moderator{
      return Err(GetW2lResultError::NotFound);
    }
  }

  if !is_moderator {
    inference_result.maybe_moderator_fields = None;
  }

  let response = GetW2lResultSuccessResponse {
    success: true,
    result: inference_result,
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| GetW2lResultError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
