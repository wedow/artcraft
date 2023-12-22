use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, ResponseError, web};
use actix_web::http::StatusCode;
use log::{error, info};

use enums::by_table::user_ratings::entity_type::UserRatingEntityType;
use enums::by_table::user_ratings::rating_value::UserRatingValue;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::composite_keys::by_table::user_ratings::user_rating_entity::UserRatingEntity;
use mysql_queries::queries::users::user_ratings::get_user_rating::{Args, get_user_rating};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;

use crate::server_state::ServerState;

// =============== Request ===============

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetUserRatingPath {
  /// The type of the entity being rated.
  pub entity_type: UserRatingEntityType,

  /// Entity token is meant to be polymorphic. It can be a TTS model, TTS result, W2L template, ... anything.
  pub entity_token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct GetUserRatingResponse {
  pub success: bool,

  /// None if not yet rated.
  /// If the user later removes their rating, it will be Some(UserRatingValue::Neutral).
  pub maybe_rating_value: Option<UserRatingValue>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum GetUserRatingError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for GetUserRatingError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetUserRatingError::BadInput(_) => StatusCode::BAD_REQUEST,
      GetUserRatingError::NotAuthorized => StatusCode::UNAUTHORIZED,
      GetUserRatingError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl std::fmt::Display for GetUserRatingError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn get_user_rating_handler(
  http_request: HttpRequest,
  path: web::Path<GetUserRatingPath>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetUserRatingError>
{
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        error!("Could not acquire DB pool: {:?}", e);
        GetUserRatingError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        GetUserRatingError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      info!("not logged in");
      return Err(GetUserRatingError::NotAuthorized);
    }
  };

  let entity= match path.entity_type {
    UserRatingEntityType::TtsModel => UserRatingEntity::TtsModel(
      TtsModelToken::new_from_str(&path.entity_token)),

    UserRatingEntityType::W2lTemplate => UserRatingEntity::W2lTemplate(
      W2lTemplateToken::new_from_str(&path.entity_token)),

    UserRatingEntityType::MediaFile => UserRatingEntity::MediaFile(MediaFileToken::new_from_str(&path.entity_token)),
    UserRatingEntityType::ModelWeight => UserRatingEntity::ModelWeight(ModelWeightToken::new_from_str(&path.entity_token)),

    // TODO: We'll handle ratings of more types in the future.
    UserRatingEntityType::W2lResult | UserRatingEntityType::TtsResult =>
      return Err(GetUserRatingError::BadInput("type not yet supported".to_string())),
  };

  let maybe_rating = get_user_rating(Args {
    user_token: &user_session.user_token_typed,
    user_rating_entity: &entity,
    mysql_connection: &mut mysql_connection
  })
      .await
      .map_err(|err| {
        error!("Error fetching rating: {:?}", err);
        GetUserRatingError::ServerError
      })?;

  let response = GetUserRatingResponse {
    success: true,
    maybe_rating_value: maybe_rating.map(|rating| rating.rating_value),
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| GetUserRatingError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
