use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::model_categories::toggle_model_category_soft_delete::{toggle_model_category_soft_delete, ToggleSoftDeleteState};

use crate::state::server_state::ServerState;

// =============== Request ===============

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteCategoryPathInfo {
  token: String,
}

#[derive(Deserialize)]
pub struct DeleteCategoryRequest {
  set_delete: bool,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct DeleteCategoryResponse {
  pub success: bool,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum DeleteCategoryError {
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for DeleteCategoryError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteCategoryError::NotFound => StatusCode::NOT_FOUND,
      DeleteCategoryError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteCategoryError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for DeleteCategoryError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn delete_category_handler(
  http_request: HttpRequest,
  path: Path<DeleteCategoryPathInfo>,
  request: web::Json<DeleteCategoryRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, DeleteCategoryError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteCategoryError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(DeleteCategoryError::NotAuthorized);
    }
  };

  // TODO: We don't have a permission for categories, so we use this as a proxy.
  if !user_session.can_ban_users {
    warn!("no permission to delete categories");
    return Err(DeleteCategoryError::NotAuthorized);
  }

  let soft_delete_state = if request.set_delete {
    ToggleSoftDeleteState::Delete
  } else {
    ToggleSoftDeleteState::Undelete
  };

  let query_result = toggle_model_category_soft_delete(
    &path.token,
    soft_delete_state,
    &server_state.mysql_pool
  ).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Delete/undelete category edit DB error: {:?}", err);
      return Err(DeleteCategoryError::ServerError);
    }
  };

  let response = DeleteCategoryResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| DeleteCategoryError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
