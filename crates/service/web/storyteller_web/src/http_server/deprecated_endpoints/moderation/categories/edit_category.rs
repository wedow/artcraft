use std::fmt;
use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use log::{log, warn};

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::model_categories::get_category_by_token::get_category_by_token;
use mysql_queries::queries::model_categories::update_model_category::{update_model_category, UpdateModelCategoryArgs};

use crate::state::server_state::ServerState;

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

  let query_result = update_model_category(UpdateModelCategoryArgs {
    name: &request.name,
    maybe_dropdown_name: request.maybe_dropdown_name.as_deref(),
    can_directly_have_models: request.can_directly_have_models,
    can_have_subcategories: request.can_have_subcategories,
    can_only_mods_apply: request.can_only_mods_apply,
    maybe_super_category_token: request.maybe_super_category_token.as_deref(),
    is_mod_approved: request.is_mod_approved,
    mod_user_token: user_session.user_token.as_str(),
    maybe_mod_comments: request.maybe_mod_comments.as_deref(),
    model_category_token: &path.token,
    mysql_pool: &server_state.mysql_pool,
  }).await;

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
