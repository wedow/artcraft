use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, ResponseError, web};
use actix_web::http::StatusCode;
use log::{error, info, warn};

use enums::by_table::user_ratings::entity_type::UserRatingEntityType;
use enums::by_table::user_ratings::rating_value::UserRatingValue;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::composite_keys::by_table::user_ratings::user_rating_entity::UserRatingEntity;
use mysql_queries::queries::users::user_ratings::update_tts_model_ratings::update_tts_model_ratings;
use mysql_queries::queries::users::user_ratings::upsert_user_rating::{Args, upsert_user_rating};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::tts_results::TtsResultToken;
use tokens::tokens::w2l_results::W2lResultToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;

use crate::server_state::ServerState;

// =============== Request ===============

#[derive(Deserialize)]
pub struct SetUserRatingRequest {
  /// The type of the entity being rated.
  pub entity_type: UserRatingEntityType,

  /// Entity token is meant to be polymorphic. It can be a TTS model, TTS result, W2L template, ... anything.
  pub entity_token: String,

  pub rating_value: UserRatingValue,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct SetUserRatingResponse {
  pub success: bool,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum SetUserRatingError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for SetUserRatingError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SetUserRatingError::BadInput(_) => StatusCode::BAD_REQUEST,
      SetUserRatingError::NotAuthorized => StatusCode::UNAUTHORIZED,
      SetUserRatingError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl std::fmt::Display for SetUserRatingError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn set_user_rating_handler(
  http_request: HttpRequest,
  request: web::Json<SetUserRatingRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, SetUserRatingError>
{
  // NB(bt,2023-12-14): Kasisnu found that we're getting entity type mismatches in production. Apart from
  // querying the database for entity existence, this is the next best way to prevent incorrect comment
  // attachment. This is a bit of a bad process, though, since the token types are supposed to be opaque.
  let token = request.entity_token.as_str();
  let token_prefix_matches = match request.entity_type {
    // NB: Users had an older prefix (U:) that got replaced with the new prefix (user_)
    UserRatingEntityType::MediaFile => token.starts_with(MediaFileToken::token_prefix()),
    UserRatingEntityType::ModelWeight => token.starts_with(ModelWeightToken::token_prefix()),
    UserRatingEntityType::TtsModel => token.starts_with(TtsModelToken::token_prefix()),
    UserRatingEntityType::TtsResult => token.starts_with(TtsResultToken::token_prefix()),
    UserRatingEntityType::W2lTemplate => token.starts_with(W2lTemplateToken::token_prefix()),
    UserRatingEntityType::W2lResult => token.starts_with(W2lResultToken::token_prefix()),
    //UserRatingEntityType::VoiceConversionModel => token.starts_with(VoiceConversionModelToken::token_prefix()),
    //UserRatingEntityType::ZsVoice => token.starts_with(ZsVoiceToken::token_prefix()),
  };

  if !token_prefix_matches {
    warn!("invalid token prefix: {:?} for {:?}", request.entity_token, request.entity_type);
    return Err(SetUserRatingError::BadInput("invalid token prefix".to_string()));
  }

  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        error!("Could not acquire DB pool: {:?}", e);
        SetUserRatingError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        SetUserRatingError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      info!("not logged in");
      return Err(SetUserRatingError::NotAuthorized);
    }
  };

  let ip_address = get_request_ip(&http_request);

  let entity= match request.entity_type {
    UserRatingEntityType::MediaFile => UserRatingEntity::MediaFile(MediaFileToken::new_from_str(&request.entity_token)),
    UserRatingEntityType::ModelWeight => UserRatingEntity::ModelWeight(ModelWeightToken::new_from_str(&request.entity_token)),

    UserRatingEntityType::TtsModel => UserRatingEntity::TtsModel(
      TtsModelToken::new_from_str(&request.entity_token)),

    UserRatingEntityType::W2lTemplate => UserRatingEntity::W2lTemplate(
      W2lTemplateToken::new_from_str(&request.entity_token)),

    // TODO: We'll handle ratings of more types in the future.
    UserRatingEntityType::W2lResult | UserRatingEntityType::TtsResult =>
      return Err(SetUserRatingError::BadInput("type not yet supported".to_string())),
  };

  let _r = upsert_user_rating(Args {
    user_token: &user_session.user_token_typed,
    user_rating_entity: &entity,
    user_rating_value: request.rating_value,
    ip_address: &ip_address,
    mysql_connection: &mut mysql_connection
  })
      .await
      .map_err(|err| {
        error!("Error upserting rating: {:?}", err);
        SetUserRatingError::ServerError
      })?;

  match request.entity_type {
    UserRatingEntityType::TtsModel => {
      let token = TtsModelToken::new_from_str(&request.entity_token);
      update_tts_model_ratings(&token, &mut mysql_connection)
          .await
          .map_err(|err| {
            error!("Error updating TTS rating summary stats: {:?}", err);
            SetUserRatingError::ServerError
          })?;
    }
    _ => {
      // TODO
    }
  }

  let response = SetUserRatingResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| SetUserRatingError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
