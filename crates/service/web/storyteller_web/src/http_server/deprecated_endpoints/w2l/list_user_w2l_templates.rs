use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::header::ContentType;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use log::{info, warn};

use mysql_queries::queries::w2l::w2l_templates::list_w2l_templates::{list_w2l_templates, W2lTemplateRecordForList};

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetProfilePathInfo {
  username: String,
}

#[derive(Serialize)]
pub struct ListW2lTemplatesForUserSuccessResponse {
  pub success: bool,
  pub templates: Vec<W2lTemplateRecordForList>,
}

#[derive(Debug)]
pub enum ListW2lTemplatesForUserError {
  ServerError,
}

impl ResponseError for ListW2lTemplatesForUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListW2lTemplatesForUserError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListW2lTemplatesForUserError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListW2lTemplatesForUserError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn list_user_w2l_templates_handler(
  http_request: HttpRequest,
  path: Path<GetProfilePathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListW2lTemplatesForUserError>
{
  return Ok(HttpResponse::Gone()
      .content_type(ContentType::plaintext())
      .body("This endpoint has been removed."))
}

pub async fn original_list_user_w2l_templates_handler(
  http_request: HttpRequest,
  path: Path<GetProfilePathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListW2lTemplatesForUserError>
{
  info!("Fetching templates for user: {}", &path.username);

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListW2lTemplatesForUserError::ServerError
      })?;

  let mut viewer_is_original_user = false;
  let mut viewer_is_moderator = false;

  match maybe_user_session {
    None => {},
    Some(session) => {
      viewer_is_moderator = session.can_delete_other_users_w2l_templates;
      viewer_is_original_user = &session.username == &path.username;
    },
  };

  // The original user can see all their uploads, as can mods.
  // Once they've been approved, everyone can see them.
  let require_mod_approved = !(viewer_is_original_user || viewer_is_moderator);

  let query_results = list_w2l_templates(
    &server_state.mysql_pool,
    Some(path.username.as_ref()),
    require_mod_approved
  ).await;

  let templates = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListW2lTemplatesForUserError::ServerError);
    }
  };

  let response = ListW2lTemplatesForUserSuccessResponse {
    success: true,
    templates,
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| ListW2lTemplatesForUserError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
