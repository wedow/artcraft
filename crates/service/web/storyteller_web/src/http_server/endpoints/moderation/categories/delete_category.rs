use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn, log};
use regex::Regex;
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

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

  let query_builder = if request.set_delete {
    sqlx::query!(r#"
      UPDATE model_categories
      SET
        deleted_at = CURRENT_TIMESTAMP
      WHERE
        token = ?
      LIMIT 1
    "#,
      path.token)

  } else {
    sqlx::query!(r#"
      UPDATE model_categories
      SET
        deleted_at = NULL
      WHERE
        token = ?
      LIMIT 1
    "#,
      path.token)
  };

  // NB: We're soft deleting so we don't delete the associations.
  let query_result = query_builder.execute(&server_state.mysql_pool).await;

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
