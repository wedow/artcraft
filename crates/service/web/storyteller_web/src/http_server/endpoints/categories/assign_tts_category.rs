use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use anyhow::anyhow;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use database_queries::queries::model_categories::get_category_by_token::get_category_by_token;
use database_queries::queries::tts::tts_models::get_tts_model::get_tts_model_by_token;
use http_server_common::request::get_request_ip::get_request_ip;
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

#[derive(Deserialize)]
pub struct AssignTtsCategoryRequest {
  category_token: String,
  tts_model_token: String,

  /// Whether to assign or delete the category.
  assign: bool,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct AssignTtsCategoryResponse {
  pub success: bool,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum AssignTtsCategoryError {
  CategoryNotFound,
  CategoryNotApplicable,
  ModelNotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for AssignTtsCategoryError {
  fn status_code(&self) -> StatusCode {
    match *self {
      AssignTtsCategoryError::CategoryNotFound => StatusCode::NOT_FOUND,
      AssignTtsCategoryError::CategoryNotApplicable => StatusCode::BAD_REQUEST,
      AssignTtsCategoryError::ModelNotFound => StatusCode::NOT_FOUND,
      AssignTtsCategoryError::NotAuthorized => StatusCode::UNAUTHORIZED,
      AssignTtsCategoryError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for AssignTtsCategoryError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn assign_tts_category_handler(
  http_request: HttpRequest,
  request: web::Json<AssignTtsCategoryRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, AssignTtsCategoryError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        AssignTtsCategoryError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(AssignTtsCategoryError::NotAuthorized);
    }
  };

  let category_lookup_result
      = get_category_by_token(&request.category_token, &server_state.mysql_pool).await;

  let category = match category_lookup_result {
    Ok(Some(result)) => {
      result
    },
    Ok(None) => {
      warn!("could not find category");
      return Err(AssignTtsCategoryError::CategoryNotFound);
    },
    Err(err) => {
      warn!("error looking up category: {:?}", err);
      return Err(AssignTtsCategoryError::ServerError);
    },
  };

  // NB: First permission check.
  // TODO: We don't have proper category permissions yet, so this is a proxy.
  let is_category_mod= user_session.can_delete_other_users_tts_models;

  // If category is exclusively for mods
  if !is_category_mod {
    if category.can_only_mods_apply {
      warn!("user is not allowed to assign this category: {}", user_session.user_token);
      return Err(AssignTtsCategoryError::NotAuthorized);
    }

    if category.deleted_at.is_some() ||
        !category.is_mod_approved.unwrap_or(false) {
      warn!("user is not allowed to see this category: {}", user_session.user_token);
      return Err(AssignTtsCategoryError::ModelNotFound);
    }
  }

  if request.assign && !category.can_directly_have_models {
    warn!("category cannot have models: {}", category.category_token);
    return Err(AssignTtsCategoryError::CategoryNotApplicable);
  }

  // NB: Second set of permission checks.
  // Only mods should see deleted models (both user_* and mod_* deleted).
  let is_mod_that_can_see_deleted = user_session.can_delete_other_users_tts_models;

  let model_lookup_result = get_tts_model_by_token(
    &request.tts_model_token,
    is_mod_that_can_see_deleted,
    &server_state.mysql_pool).await;

  let model_record = match model_lookup_result {
    Ok(Some(result)) => {
      result
    },
    Ok(None) => {
      warn!("could not find model");
      return Err(AssignTtsCategoryError::ModelNotFound);
    },
    Err(err) => {
      warn!("error looking up model: {:?}", err);
      return Err(AssignTtsCategoryError::ServerError);
    },
  };

  // NB: Third set of permission checks
  let is_author = model_record.creator_user_token == user_session.user_token;
  let is_mod = user_session.can_edit_other_users_tts_models ;

  if !is_author && !is_mod {
    warn!("user is not allowed to add categories to model: {}", user_session.user_token);
    return Err(AssignTtsCategoryError::NotAuthorized);
  }

  if !is_mod {
    if model_record.is_locked_from_user_modification || model_record.is_locked_from_use {
      return Err(AssignTtsCategoryError::NotAuthorized);
    }
  }

  let ip_address = get_request_ip(&http_request);

  let query_builder = if request.assign {
    // NB: deleted_at = NULL
    sqlx::query!(r#"
      INSERT INTO tts_category_assignments
      SET
        model_token = ?,
        category_token = ?,
        category_addition_user_token = ?,
        ip_address_creation = ?,
        ip_address_last_update = ?,
        deleted_at = NULL
      ON DUPLICATE KEY UPDATE
        model_token = ?,
        category_token = ?,
        category_addition_user_token = ?,
        ip_address_last_update = ?,
        deleted_at = NULL
    "#,
      // Insert
      &request.tts_model_token,
      &request.category_token,
      &user_session.user_token,
      &ip_address,
      &ip_address,
      // Update
      &request.tts_model_token,
      &request.category_token,
      &user_session.user_token,
      &ip_address,
    )

  } else {
    // NB: deleted_at = CURRENT_TIMESTAMP
    sqlx::query!(r#"
      INSERT INTO tts_category_assignments
      SET
        model_token = ?,
        category_token = ?,
        category_removal_user_token = ?,
        ip_address_creation = ?,
        ip_address_last_update = ?,
        deleted_at = CURRENT_TIMESTAMP
      ON DUPLICATE KEY UPDATE
        model_token = ?,
        category_token = ?,
        category_removal_user_token = ?,
        ip_address_last_update = ?,
        deleted_at = CURRENT_TIMESTAMP
    "#,
      // Insert
      &request.tts_model_token,
      &request.category_token,
      &user_session.user_token,
      &ip_address,
      &ip_address,
      // Update
      &request.tts_model_token,
      &request.category_token,
      &user_session.user_token,
      &ip_address,
    )
  };

  // NB: We're soft deleting so we don't delete the associations.
  let query_result = query_builder.execute(&server_state.mysql_pool).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Assign category edit DB error: {:?}", err);
      return Err(AssignTtsCategoryError::ServerError);
    }
  };

  let response = AssignTtsCategoryResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| AssignTtsCategoryError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
