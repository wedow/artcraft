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
use database_queries::tokens::Tokens;
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

const DEFAULT_CAN_DIRECTLY_HAVE_MODELS : bool = true;
const DEFAULT_CAN_HAVE_SUBCATEGORIES : bool = false;
const DEFAULT_CAN_ONLY_MODS_APPLY : bool = false;

// =============== Request ===============

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelType {
  /// 'tts' in database
  Tts,
  /// 'w2l' in database
  W2l,
}

#[derive(Deserialize)]
pub struct CreateCategoryRequest {
  // Fields for everyone
  pub name: Option<String>,
  pub model_type: Option<ModelType>,
  pub idempotency_token: Option<String>,

  // Fields for moderators only
  pub can_directly_have_models: Option<bool>,
  pub can_have_subcategories: Option<bool>,
  pub can_only_mods_apply: Option<bool>,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct CreateCategoryResponse {
  pub success: bool,
  pub token: Option<String>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum CreateCategoryError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for CreateCategoryError {
  fn status_code(&self) -> StatusCode {
    match *self {
      CreateCategoryError::BadInput(_) => StatusCode::BAD_REQUEST,
      CreateCategoryError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CreateCategoryError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for CreateCategoryError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn create_category_handler(
  http_request: HttpRequest,
  request: web::Json<CreateCategoryRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CreateCategoryError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CreateCategoryError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CreateCategoryError::NotAuthorized);
    }
  };

  // NB: First permission check.
  // TODO: We don't have a permission for categories, so we use this as a proxy.
  let is_mod = user_session.can_ban_users;

  let model_type = match request.model_type {
    None => {
      return Err(CreateCategoryError::BadInput("no model type".to_string()));
    }
    Some(ModelType::Tts) => "tts",
    Some(ModelType::W2l) => "w2l",
  };

  let idempotency_token = request.idempotency_token
      .clone()
      .ok_or(CreateCategoryError::BadInput("no idempotency token provided".to_string()))?;

  let name = request.name
      .clone()
      .ok_or(CreateCategoryError::BadInput("no name provided".to_string()))?;

  let category_token = Tokens::new_category()
      .map_err(|e| {
        warn!("Bad crockford token: {:?}", e);
        CreateCategoryError::ServerError
      })?;

  let creator_ip_address = get_request_ip(&http_request);

  let mut is_mod_approved = false;
  let mut maybe_mod_user_token = None;
  let mut can_directly_have_models = DEFAULT_CAN_DIRECTLY_HAVE_MODELS;
  let mut can_have_subcategories = DEFAULT_CAN_HAVE_SUBCATEGORIES;
  let mut can_only_mods_apply = DEFAULT_CAN_ONLY_MODS_APPLY;

  if is_mod {
    // Moderator fields and adjustments
    is_mod_approved = true;
    maybe_mod_user_token = Some(user_session.user_token.clone());
    can_directly_have_models = request.can_directly_have_models
        .unwrap_or(DEFAULT_CAN_DIRECTLY_HAVE_MODELS);
    can_have_subcategories = request.can_have_subcategories
        .unwrap_or(DEFAULT_CAN_HAVE_SUBCATEGORIES);
    can_only_mods_apply = request.can_only_mods_apply
        .unwrap_or(DEFAULT_CAN_ONLY_MODS_APPLY);
  }

  let query_result = sqlx::query!(
        r#"
INSERT INTO model_categories
SET
    token = ?,
    uuid_idempotency_token = ?,
    model_type = ?,
    name = ?,

    creator_user_token = ?,
    creator_ip_address_creation = ?,
    creator_ip_address_last_update = ?,

    is_mod_approved = ?,
    maybe_mod_user_token = ?,
    can_directly_have_models = ?,
    can_have_subcategories = ?,
    can_only_mods_apply = ?
        "#,

    category_token,
    idempotency_token,
    model_type,
    name,
    &user_session.user_token,
    &creator_ip_address,
    &creator_ip_address,
    is_mod_approved,
    maybe_mod_user_token,
    can_directly_have_models,
    can_have_subcategories,
    can_only_mods_apply
  )
  .execute(&server_state.mysql_pool)
    .await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Create category edit DB error: {:?}", err);
      return Err(CreateCategoryError::ServerError);
    }
  };

  let response = CreateCategoryResponse {
    success: true,
    token: Some(category_token.to_string())
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| CreateCategoryError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
