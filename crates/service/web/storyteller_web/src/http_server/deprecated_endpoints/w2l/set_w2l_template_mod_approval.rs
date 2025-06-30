use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::w2l::w2l_templates::get_w2l_template::select_w2l_template_by_token;
use mysql_queries::queries::w2l::w2l_templates::set_w2l_template_mod_approval::set_w2l_template_mod_approval;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct SetW2lTemplateModApprovalPathInfo {
  token: String,
}

#[derive(Deserialize)]
pub struct SetW2lTemplateModApprovalRequest {
  is_approved: bool,
}

#[derive(Serialize)]
pub struct SetW2lTemplateModApprovalSuccessResponse {
  pub success: bool,
}

#[derive(Debug)]
pub enum SetW2lTemplateModApprovalError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  ServerError,
}

impl ResponseError for SetW2lTemplateModApprovalError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SetW2lTemplateModApprovalError::BadInput(_) => StatusCode::BAD_REQUEST,
      SetW2lTemplateModApprovalError::NotAuthorized => StatusCode::UNAUTHORIZED,
      SetW2lTemplateModApprovalError::NotFound => StatusCode::NOT_FOUND,
      SetW2lTemplateModApprovalError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      SetW2lTemplateModApprovalError::BadInput(reason) => reason.to_string(),
      SetW2lTemplateModApprovalError::NotAuthorized => "unauthorized".to_string(),
      SetW2lTemplateModApprovalError::NotFound => "not found".to_string(),
      SetW2lTemplateModApprovalError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for SetW2lTemplateModApprovalError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn set_w2l_template_mod_approval_handler(
  http_request: HttpRequest,
  path: Path<SetW2lTemplateModApprovalPathInfo>,
  request: web::Json<SetW2lTemplateModApprovalRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, SetW2lTemplateModApprovalError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        SetW2lTemplateModApprovalError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(SetW2lTemplateModApprovalError::NotAuthorized);
    }
  };

  if !user_session.can_approve_w2l_templates {
    warn!("user is not allowed to approve templates: {:?}", user_session.user_token);
    return Err(SetW2lTemplateModApprovalError::NotAuthorized);
  }

  let template_query_result = select_w2l_template_by_token(
    &path.token,
    true, // Only mods can perform this action
    &server_state.mysql_pool,
  ).await;

  let w2l_template = match template_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(SetW2lTemplateModApprovalError::ServerError);
    }
    Ok(None) => return Err(SetW2lTemplateModApprovalError::NotFound),
    Ok(Some(template)) => template,
  };

  let ip_address = get_request_ip(&http_request);

  let query_result = set_w2l_template_mod_approval(
    &path.token,
    user_session.user_token.as_str(),
    request.is_approved,
    &server_state.mysql_pool,
  ).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Update w2l mod approval status DB error: {:?}", err);
      return Err(SetW2lTemplateModApprovalError::ServerError);
    }
  };

  let response = SetW2lTemplateModApprovalSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| SetW2lTemplateModApprovalError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
