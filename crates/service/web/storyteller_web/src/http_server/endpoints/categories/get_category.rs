use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use chrono::{DateTime, Utc};
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
pub struct GetCategoryPathInfo {
  /// TTS model token
  token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct GetCategoryResponse {
  pub success: bool,
  pub category: DisplayCategory,
}

/// Public-facing and optimized (non-irrelevant fields) category list
/// Used for the main TTS dropdown as well as the TTS edit/tagging UI
#[derive(Serialize)]
pub struct DisplayCategory {
  pub category_token: String,

  pub model_type: String, // TODO: ENUM

  pub maybe_super_category_token: Option<String>,

  pub can_directly_have_models: bool,
  pub can_have_subcategories: bool,
  pub can_only_mods_apply: bool,

  pub name: String,
  pub maybe_dropdown_name: Option<String>,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub is_mod_approved: Option<bool>,

  /// Absent for non-mods
  pub maybe_mod_comments: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub deleted_at: Option<DateTime<Utc>>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum GetCategoryError {
  NotFound,
  ServerError,
}

impl ResponseError for GetCategoryError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetCategoryError::NotFound => StatusCode::NOT_FOUND,
      GetCategoryError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetCategoryError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn get_category_handler(
  http_request: HttpRequest,
  path: Path<GetCategoryPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetCategoryError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetCategoryError::ServerError
      })?;

  // TODO: We don't have any permissions for categories. This is a proxy.
  let is_mod = maybe_user_session
      .map(|session| session.can_ban_users)
      .unwrap_or(false);

  let category_lookup_result
      = get_category_by_token(&path.token, &server_state.mysql_pool).await;

  let category = match category_lookup_result {
    Ok(Some(result)) => {
      result
    },
    Ok(None) => {
      warn!("could not find category");
      return Err(GetCategoryError::NotFound);
    },
    Err(err) => {
      warn!("error looking up category: {:?}", err);
      return Err(GetCategoryError::ServerError);
    },
  };

  let category_for_response = DisplayCategory {
    category_token: category.category_token.clone(),
    model_type: category.model_type.clone(),
    maybe_super_category_token: category.maybe_super_category_token.clone(),
    can_directly_have_models: category.can_directly_have_models,
    can_have_subcategories: category.can_have_subcategories,
    can_only_mods_apply: category.can_only_mods_apply,
    name: category.name.clone(),
    maybe_dropdown_name: category.maybe_dropdown_name.clone(),
    creator_user_token: category.creator_user_token.clone(),
    creator_username: category.creator_username.clone(),
    creator_display_name: category.creator_display_name.clone(),
    creator_gravatar_hash: category.creator_gravatar_hash.clone(),
    is_mod_approved: category.is_mod_approved.clone(),
    created_at: category.created_at.clone(),
    updated_at: category.updated_at.clone(),
    deleted_at: category.deleted_at.clone(),
    // Moderator fields
    // Clear out fields for non-mods
    maybe_mod_comments: if is_mod { category.maybe_mod_comments.clone() } else { None },
  };

  let response = GetCategoryResponse {
    success: true,
    category: category_for_response,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| GetCategoryError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
