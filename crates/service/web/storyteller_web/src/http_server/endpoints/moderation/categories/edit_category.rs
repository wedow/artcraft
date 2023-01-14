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
use database_queries::queries::model_categories::get_category_by_token::get_category_by_token;
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
pub struct EditCategoryPathInfo {
  token: String,
}

// NB: ONLY MODERATORS CAN EDIT CATEGORIES.
// These are not sparse updates!
#[derive(Deserialize)]
pub struct EditCategoryRequest {
  pub name: String,

  // If absent, null the fields.
  pub maybe_dropdown_name: Option<String>,
  pub maybe_super_category_token: Option<String>,

  pub can_directly_have_models: bool,
  pub can_have_subcategories: bool,
  pub can_only_mods_apply: bool,

  // Moderation fields
  pub is_mod_approved: bool,

  // If absent, null the field.
  pub maybe_mod_comments: Option<String>,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct EditCategoryResponse {
  pub success: bool,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum EditCategoryError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for EditCategoryError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EditCategoryError::BadInput(_) => StatusCode::BAD_REQUEST,
      EditCategoryError::NotFound => StatusCode::NOT_FOUND,
      EditCategoryError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EditCategoryError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EditCategoryError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn edit_category_handler(
  http_request: HttpRequest,
  path: Path<EditCategoryPathInfo>,
  request: web::Json<EditCategoryRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EditCategoryError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        EditCategoryError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(EditCategoryError::NotAuthorized);
    }
  };

  // TODO: We don't have a permission for categories, so we use this as a proxy.
  if !user_session.can_ban_users {
    warn!("no permission to edit categories");
    return Err(EditCategoryError::NotAuthorized);
  }

  // Category tree integrity
  if let Some(parent_category_token) = request.maybe_super_category_token.as_deref() {
    if parent_category_token == &path.token {
      return Err(EditCategoryError::BadInput(
        "category cannot have itself as a parent".to_string()));
    }

    let parent_category_lookup
        = get_category_by_token(parent_category_token, &server_state.mysql_pool).await;

    match parent_category_lookup {
      Ok(Some(parent_category)) => {
        if !parent_category.can_have_subcategories {
          return Err(EditCategoryError::BadInput(
            "parent category cannot have children".to_string()));
        }
      },
      Ok(None) => return Err(EditCategoryError::NotFound),
      Err(err) => {
        warn!("Category lookup DB error: {:?}", err);
        return Err(EditCategoryError::ServerError)
      },
    }
  }

  let query_result =
    // We need to store the IP address details.
    sqlx::query!(
        r#"
UPDATE model_categories
SET
    name = ?,
    maybe_dropdown_name = ?,

    can_directly_have_models = ?,
    can_have_subcategories = ?,
    can_only_mods_apply = ?,

    maybe_super_category_token = ?,

    is_mod_approved = ?,
    maybe_mod_user_token = ?,
    maybe_mod_comments = ?,

    version = version + 1

WHERE token = ?
LIMIT 1
        "#,
      &request.name,
      &request.maybe_dropdown_name,
      &request.can_directly_have_models,
      &request.can_have_subcategories,
      &request.can_only_mods_apply,
      &request.maybe_super_category_token,
      &request.is_mod_approved,
      &user_session.user_token,
      &request.maybe_mod_comments,
      &path.token,
    )
        .execute(&server_state.mysql_pool)
        .await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Edit category DB error: {:?}", err);
      return Err(EditCategoryError::ServerError);
    }
  };

  let response = EditCategoryResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| EditCategoryError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
