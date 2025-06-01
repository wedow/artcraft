use std::fmt;
use std::sync::Arc;

use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::header::ContentType;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Query};
use log::{info, log, warn};

use mysql_queries::queries::w2l::w2l_results::list_w2l_inference_results_query_builder::ListW2lResultsQueryBuilder;
use mysql_queries::queries::w2l::w2l_results::list_w2l_inference_results_query_builder::W2lInferenceRecordForList;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct ListW2lInferenceResultsForUserPathInfo {
  username: String,
}

#[derive(Deserialize)]
pub struct ListW2lInferenceResultsForUserQuery {
  pub sort_ascending: Option<bool>,
  pub limit: Option<u16>,
  pub cursor: Option<String>,
  pub cursor_is_reversed: Option<bool>,
}

#[derive(Serialize)]
pub struct ListW2lInferenceResultsForUserSuccessResponse {
  pub success: bool,
  pub results: Vec<W2lInferenceRecordForList>,
  pub cursor_next: Option<String>,
  pub cursor_previous: Option<String>,
}

#[derive(Debug)]
pub enum ListW2lInferenceResultsForUserError {
  ServerError,
}

impl ResponseError for ListW2lInferenceResultsForUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListW2lInferenceResultsForUserError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListW2lInferenceResultsForUserError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListW2lInferenceResultsForUserError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn list_user_w2l_inference_results_handler(
  http_request: HttpRequest,
  path: Path<ListW2lInferenceResultsForUserPathInfo>,
  query: Query<ListW2lInferenceResultsForUserQuery>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListW2lInferenceResultsForUserError>
{
  return Ok(HttpResponse::Gone()
      .content_type(ContentType::plaintext())
      .body("This endpoint has been removed."))
}

pub async fn original_list_user_w2l_inference_results_handler(
  http_request: HttpRequest,
  path: Path<ListW2lInferenceResultsForUserPathInfo>,
  query: Query<ListW2lInferenceResultsForUserQuery>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListW2lInferenceResultsForUserError>
{
  info!("Fetching inference results for user: {}", &path.username);

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListW2lInferenceResultsForUserError::ServerError
      })?;

  let mut is_author = false;
  let mut is_mod_that_can_see_deleted = false;
  let mut is_mod_that_can_approve_w2l_templates = false;

  match maybe_user_session {
    None => {},
    Some(session) => {
      is_author = session.username == path.username;
      is_mod_that_can_see_deleted = session.can_delete_other_users_w2l_results;
      is_mod_that_can_approve_w2l_templates = session.can_approve_w2l_templates;
    },
  };

  // TODO: Enforce real maximums and defaults
  let limit = query.limit.unwrap_or(25);
  //let limit = std::cmp::max(limit, 100);

  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

  let cursor = if let Some(cursor) = query.cursor.as_deref() {
    let cursor = server_state.sort_key_crypto.decrypt_id(cursor)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListW2lInferenceResultsForUserError::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let include_user_hidden = is_author || is_mod_that_can_see_deleted;
  let include_unapproved = is_author || is_mod_that_can_approve_w2l_templates;

  let mut query_builder = ListW2lResultsQueryBuilder::new()
      .sort_ascending(sort_ascending)
      .scope_creator_username(Some(path.username.as_ref()))
      .include_user_hidden(include_user_hidden)
      .include_user_deleted_results(is_mod_that_can_see_deleted)
      .include_mod_deleted_results(is_mod_that_can_see_deleted)
      .include_templates_not_approved_for_public_listing(include_unapproved)
      .limit(limit)
      .cursor_is_reversed(cursor_is_reversed)
      .offset(cursor);

  let query_results = query_builder.perform_query_for_page(&server_state.mysql_pool)
      .await;

  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListW2lInferenceResultsForUserError::ServerError);
    }
  };

  let cursor_next = if let Some(id) = results_page.last_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListW2lInferenceResultsForUserError::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let cursor_previous = if let Some(id) = results_page.first_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListW2lInferenceResultsForUserError::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let response = ListW2lInferenceResultsForUserSuccessResponse {
    success: true,
    results: results_page.inference_records,
    cursor_next,
    cursor_previous,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListW2lInferenceResultsForUserError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
