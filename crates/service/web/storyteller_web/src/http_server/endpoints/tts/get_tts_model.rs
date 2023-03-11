// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpResponse, HttpRequest};
use chrono::{DateTime, Utc};
use crate::server_state::ServerState;
use database_queries::column_types::vocoder_type::VocoderType;
use database_queries::queries::tts::tts_models::get_tts_model::get_tts_model_by_token_using_connection;
use enums::common::visibility::Visibility;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::warn;
use std::fmt;
use std::sync::Arc;
use tts_common::text_pipelines::guess_pipeline::guess_text_pipeline_heuristic;
use tts_common::text_pipelines::text_pipeline_type::TextPipelineType;

// =============== Request ===============

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetTtsModelPathInfo {
  token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct GetTtsModelSuccessResponse {
  pub success: bool,
  pub model: TtsModelInfo,
}

/// Publicly exposed TTS model fields.
#[derive(Serialize)]
pub struct TtsModelInfo {
  pub model_token: String,
  pub tts_model_type: String,

  /// Named text pipeline/algorithm, eg. "legacy_fakeyou", "english_v1", "spanish_v2", etc.
  ///
  /// >> NB: text_pipeline_type may not always be present in the database, but if absent we'll
  /// inform the frontend (and inference pipeline) of our best guess according to a heuristic.
  pub text_pipeline_type: Option<TextPipelineType>,
  pub text_pipeline_type_guess: TextPipelineType,
  pub text_preprocessing_algorithm: String,

  /// [vocoders 1]
  /// This is the new type of vocoder configuration. Users can choose a custom trained
  /// vocoder to associate with their model. The tokens reference the `vocoder_models`
  /// table.
  pub maybe_custom_vocoder: Option<CustomVocoderInfo>,

  /// [vocoders 2]
  /// This is the old type of vocoder configuration, which leverages old pretrained
  /// vocoders that we manually uploaded. There aren't many good options for users to
  /// choose here, so this should be treated as a legacy option going forward. We'll
  /// likely be stuck with this configuration for some time, however, due to the large
  /// collection of legacy models we have.
  pub maybe_default_pretrained_vocoder: Option<VocoderType>,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub is_front_page_featured: bool,
  pub is_twitch_featured: bool,

  pub maybe_suggested_unique_bot_command: Option<String>,

  pub user_ratings: UserRatingsStats,

  pub creator_set_visibility: Visibility,

  pub is_locked_from_use: bool,
  pub is_locked_from_user_modification: bool,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// NB: Moderator fields are sensitive and should only be displayed for moderators!
  pub maybe_moderator_fields: Option<TtsModelModeratorFieldInfo>,
}

/// New vocoder configuration options.
#[derive(Serialize)]
pub struct CustomVocoderInfo {
  pub vocoder_token: String,
  pub vocoder_title: String,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
}

#[derive(Serialize)]
pub struct UserRatingsStats {
  pub positive_count: u32,
  pub negative_count: u32,
  /// Total count does not take into account "neutral" ratings.
  pub total_count: u32,
}

/// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
/// It's the web endpoint controller's responsibility to clear these for non-mods.
#[derive(Serialize)]
pub struct TtsModelModeratorFieldInfo {
  // Moderator-set mel multiply factors
  // These fields are misleadingly named just in case a competitor is snooping the javascript.
  pub use_default_m_factor: bool,
  pub maybe_custom_m_factor: Option<f64>,

  pub creator_is_banned: bool,
  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum GetTtsModelError {
  ServerError,
  NotFound,
}

impl ResponseError for GetTtsModelError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetTtsModelError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetTtsModelError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetTtsModelError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn get_tts_model_handler(
  http_request: HttpRequest,
  path: Path<GetTtsModelPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetTtsModelError>
{
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        GetTtsModelError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetTtsModelError::ServerError
      })?;

  let mut show_deleted_models = false;
  let mut is_moderator = false;
  let mut is_original_author = false;

  if let Some(user_session) = &maybe_user_session {
    // NB: Moderators can see deleted models
    // Original creators cannot see them (unless they're moderators!)
    show_deleted_models = user_session.can_delete_other_users_tts_models;
    // Moderators get to see all the fields.
    is_moderator = user_session.can_delete_other_users_tts_results
        || user_session.can_edit_other_users_tts_models;
  }

  let model_query_result = get_tts_model_by_token_using_connection(
    &path.token,
    show_deleted_models,
    &mut mysql_connection,
  ).await;

  let mut model = match model_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(GetTtsModelError::ServerError);
    }
    Ok(None) => return Err(GetTtsModelError::NotFound),
    Ok(Some(model)) => model,
  };

  if let Some(user_session) = &maybe_user_session {
    is_original_author = user_session.user_token == model.creator_user_token;
  }

  if let Some(moderator_fields) = model.maybe_moderator_fields.as_ref() {
    // NB: The moderator fields will always be present before removal
    // We don't want non-mods seeing stuff made by banned users.
    if moderator_fields.creator_is_banned && !is_moderator {
      return Err(GetTtsModelError::NotFound);
    }
  }

  if !is_moderator {
    model.maybe_moderator_fields = None;
  }

  let text_pipeline_type = model.text_pipeline_type
      .as_deref()
      .and_then(|pipeline_type| {
        // If there's an error deserializing, turn it to None instead of 500ing. The column is
        // nullable by default, and legacy records have no type.
        TextPipelineType::from_str(pipeline_type).ok()
      })
      .map(|pipeline_type| {
        // NB(bt, 2022-07-27): For now, we're being intentionally misleading and obscuring our text
        //  pipelines so that UberDuck doesn't catch on about Espeak. Only uploaders and mods will
        //  see the original value.
        if is_moderator || is_original_author {
          pipeline_type.to_api_variant_for_authors_and_mods()
        } else {
          pipeline_type.to_api_variant_for_anyone()
        }
      });

  // TODO: Use language to infer as well.
  let text_pipeline_type_guess =
      guess_text_pipeline_heuristic(Some(model.created_at.clone()));

  // Map to public response type.
  let response = GetTtsModelSuccessResponse {
    success: true,
    model: TtsModelInfo {
      model_token: model.model_token,
      tts_model_type: model.tts_model_type,
      text_pipeline_type,
      text_pipeline_type_guess,
      maybe_custom_vocoder: match model.maybe_custom_vocoder {
        None => None,
        Some(vocoder) => Some(CustomVocoderInfo {
          vocoder_token: vocoder.vocoder_token,
          vocoder_title: vocoder.vocoder_title,
          creator_user_token: vocoder.creator_user_token,
          creator_username: vocoder.creator_username,
          creator_display_name: vocoder.creator_display_name,
          creator_gravatar_hash: vocoder.creator_gravatar_hash,
        })
      },
      maybe_default_pretrained_vocoder: model.maybe_default_pretrained_vocoder,
      text_preprocessing_algorithm: model.text_preprocessing_algorithm,
      creator_user_token: model.creator_user_token,
      creator_username: model.creator_username,
      creator_display_name: model.creator_display_name,
      creator_gravatar_hash: model.creator_gravatar_hash,
      title: model.title,
      description_markdown: model.description_markdown,
      description_rendered_html: model.description_rendered_html,
      ietf_language_tag: model.ietf_language_tag,
      ietf_primary_language_subtag: model.ietf_primary_language_subtag,
      is_front_page_featured: model.is_front_page_featured,
      is_twitch_featured: model.is_twitch_featured,
      maybe_suggested_unique_bot_command: model.maybe_suggested_unique_bot_command,
      user_ratings: UserRatingsStats {
        positive_count: model.user_ratings_positive_count,
        negative_count: model.user_ratings_negative_count,
        total_count: model.user_ratings_total_count,
      },
      creator_set_visibility: model.creator_set_visibility,
      is_locked_from_use: model.is_locked_from_use,
      is_locked_from_user_modification: model.is_locked_from_user_modification,
      created_at: model.created_at,
      updated_at: model.updated_at,
      maybe_moderator_fields: model.maybe_moderator_fields.map(|mod_fields| {
        TtsModelModeratorFieldInfo {
          use_default_m_factor: mod_fields.use_default_mel_multiply_factor,
          maybe_custom_m_factor: mod_fields.maybe_custom_mel_multiply_factor,
          creator_is_banned: mod_fields.creator_is_banned,
          creator_ip_address_creation: mod_fields.creator_ip_address_creation,
          creator_ip_address_last_update: mod_fields.creator_ip_address_last_update,
          user_deleted_at: mod_fields.user_deleted_at,
          mod_deleted_at: mod_fields.mod_deleted_at,
        }
      })
    },
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| GetTtsModelError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
