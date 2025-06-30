use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use log::warn;

use mysql_queries::queries::w2l::w2l_templates::get_w2l_template::select_w2l_template_by_token;
use mysql_queries::queries::w2l::w2l_templates::get_w2l_template::W2lTemplateRecordForResponse;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetW2lTemplatePathInfo {
  token: String,
}

#[derive(Serialize)]
pub struct GetW2lTemplateSuccessResponse {
  pub success: bool,
  pub template: W2lTemplateRecordForResponse,
}

#[derive(Debug)]
pub enum GetW2lTemplateError {
  ServerError,
  NotFound,
}

impl ResponseError for GetW2lTemplateError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetW2lTemplateError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
      GetW2lTemplateError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetW2lTemplateError::ServerError => "server error".to_string(),
      GetW2lTemplateError::NotFound=> "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetW2lTemplateError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_w2l_template_handler(
  http_request: HttpRequest,
  path: Path<GetW2lTemplatePathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetW2lTemplateError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetW2lTemplateError::ServerError
      })?;

  let mut show_deleted_templates = false;
  let mut is_moderator = false;

  if let Some(user_session) = maybe_user_session {
    // NB: Moderators can see deleted templates.
    // Original creators cannot see them (unless they're moderators!)
    show_deleted_templates = user_session.can_delete_other_users_w2l_templates;
    // Moderators get to see all the fields.
    is_moderator = user_session.can_delete_other_users_w2l_results
        || user_session.can_edit_other_users_w2l_templates;
  }

  let template_query_result = select_w2l_template_by_token(
    &path.token,
    show_deleted_templates,
    &server_state.mysql_pool
  ).await;

  let mut template = match template_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(GetW2lTemplateError::ServerError);
    }
    Ok(None) => return Err(GetW2lTemplateError::NotFound),
    Ok(Some(template)) => template,
  };

  if let Some(moderator_fields) = template.maybe_moderator_fields.as_ref() {
    // NB: The moderator fields will always be present before removal
    // We don't want non-mods seeing stuff made by banned users.
    if moderator_fields.creator_is_banned && !is_moderator {
      return Err(GetW2lTemplateError::NotFound);
    }
  }

  if !is_moderator {
    template.maybe_moderator_fields = None;
  }

  let response = GetW2lTemplateSuccessResponse {
    success: true,
    template,
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| GetW2lTemplateError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
