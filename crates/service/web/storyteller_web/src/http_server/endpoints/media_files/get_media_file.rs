use std::fmt;
use std::sync::Arc;

use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use chrono::{DateTime, Utc};
use log::warn;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use mysql_queries::queries::media_files::get_media_file::get_media_file;
use mysql_queries::queries::tts::tts_results::query_tts_result::select_tts_result_by_token;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetMediaFilePathInfo {
  token: MediaFileToken,
}

#[derive(Serialize)]
pub struct GetMediaFileSuccessResponse {
  pub success: bool,
  pub media_file: MediaFile,
}

#[derive(Serialize)]
pub struct MediaFile {
  pub token: MediaFileToken,

  /// Type of media will dictate which fields are populated and what
  /// the frontend should display (eg. video player vs audio player).
  pub media_type: MediaFileType,

  /// URL to the media file
  pub public_bucket_path: String,

  //// Provenance Data
  //pub origin_product: MediaFileOriginProductCategory,
  //pub origin_category: MediaFileOriginCategory,
  //pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  //pub maybe_origin_model_token: Option<String>,
  //pub maybe_origin_filename: Option<String>,

  /// User info
  pub maybe_creator_user: Option<UserDetailsLight>,

  pub creator_set_visibility: Visibility,

  /// We can simulate media files for "tts_results" records.
  /// If this is set as true, this informs the frontend and API callers not to treat
  /// the token as a media file and improperly assume it can be used with the rest of
  /// the media file APIs.
  pub is_emulated_media_file: bool,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  //pub maybe_moderator_fields: Option<ModeratorFields>,
}

//#[derive(Serialize)]
//pub struct ModeratorFields {
//  pub creator_ip_address: String,
//  pub creator_is_banned_if_user: bool,
//  pub maybe_creator_deleted_at: Option<DateTime<Utc>>,
//  pub maybe_mod_deleted_at: Option<DateTime<Utc>>,
//}

#[derive(Debug)]
pub enum GetMediaFileError {
  ServerError,
  NotFound,
}

impl ResponseError for GetMediaFileError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetMediaFileError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
      GetMediaFileError::NotFound=> StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetMediaFileError::ServerError => "server error".to_string(),
      GetMediaFileError::NotFound => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetMediaFileError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_media_file_handler(
  http_request: HttpRequest,
  path: Path<GetMediaFilePathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetMediaFileError>
{
  let media_file_token = path.into_inner().token;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetMediaFileError::ServerError
      })?;

  let mut show_deleted_results = false;
  let mut is_moderator = false;

  if let Some(user_session) = maybe_user_session {
    // NB: Moderators can see deleted results.
    // Original creators cannot see them (unless they're moderators!)
    show_deleted_results = user_session.can_delete_other_users_tts_results;
    // Moderators get to see all the fields.
    is_moderator = user_session.can_delete_other_users_tts_results
        || user_session.can_edit_other_users_tts_models;
  }

  // NB(bt,2023-11-27): We're moving TT2 results over to the `media_files` table, originally from
  // the `tts_results_table`. We're emulating media files (for viewing) to support API clients
  // (eg. the AI streamer shows).
  let response = if media_file_token.0.starts_with("TR:") {
    // NB: This is the exceptional case, where we emulate results in the `tts_results` table as media files
    emulate_media_file_with_legacy_tts_result_lookup(&media_file_token, show_deleted_results, &server_state).await?
  } else {
    modern_media_file_lookup(&media_file_token, show_deleted_results, &server_state).await?
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| GetMediaFileError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}

async fn modern_media_file_lookup(
  media_file_token: &MediaFileToken,
  show_deleted_results: bool,
  server_state: &ServerState,
) -> Result<GetMediaFileSuccessResponse, GetMediaFileError> {

  let result = get_media_file(
    media_file_token,
    show_deleted_results,
    &server_state.mysql_pool
  ).await;

  let result = match result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(GetMediaFileError::ServerError);
    }
    Ok(None) => return Err(GetMediaFileError::NotFound),
    Ok(Some(result)) => result,
  };

  //if let Some(moderator_fields) = result.maybe_moderator_fields.as_ref() {
  //  // NB: The moderator fields will always be present before removal
  //  // We don't want non-mods seeing stuff made by banned users.
  //  if (moderator_fields.model_creator_is_banned || moderator_fields.result_creator_is_banned_if_user)
  //      && !is_moderator{
  //    return Err(GetMediaFileError::NotFound);
  //  }
  //}

  //if !is_moderator {
  //  result.maybe_moderator_fields = None;
  //}

  let public_bucket_path = MediaFileBucketPath::from_object_hash(
    &result.public_bucket_directory_hash,
    result.maybe_public_bucket_prefix.as_deref(),
    result.maybe_public_bucket_extension.as_deref())
      .get_full_object_path_str()
      .to_string();

  Ok(GetMediaFileSuccessResponse {
    success: true,
    media_file: MediaFile {
      token: result.token,
      media_type: result.media_type,
      public_bucket_path,
      maybe_creator_user: UserDetailsLight::from_optional_db_fields_owned(
        result.maybe_creator_user_token,
        result.maybe_creator_username,
        result.maybe_creator_display_name,
        result.maybe_creator_gravatar_hash,
      ),
      creator_set_visibility: result.creator_set_visibility,
      is_emulated_media_file: false,
      created_at: result.created_at,
      updated_at: result.updated_at,
    },
  })
}

async fn emulate_media_file_with_legacy_tts_result_lookup(
  media_file_token: &MediaFileToken,
  show_deleted_results: bool,
  server_state: &ServerState,
) -> Result<GetMediaFileSuccessResponse, GetMediaFileError> {

  let result = select_tts_result_by_token(
    &media_file_token.as_str(),
    show_deleted_results,
    &server_state.mysql_pool
  ).await;

  let result = match result {
    Err(e) => {
      warn!("query error (legacy TTS): {:?}", e);
      return Err(GetMediaFileError::ServerError);
    }
    Ok(None) => return Err(GetMediaFileError::NotFound),
    Ok(Some(result)) => result,
  };

  //if let Some(moderator_fields) = result.maybe_moderator_fields.as_ref() {
  //  // NB: The moderator fields will always be present before removal
  //  // We don't want non-mods seeing stuff made by banned users.
  //  if (moderator_fields.model_creator_is_banned || moderator_fields.result_creator_is_banned_if_user)
  //      && !is_moderator{
  //    return Err(GetMediaFileError::NotFound);
  //  }
  //}

  //if !is_moderator {
  //  result.maybe_moderator_fields = None;
  //}

  // NB: TTS results receive the legacy treatment where their table only reports the full bucket path
  let public_bucket_path = result.public_bucket_wav_audio_path.clone();

  // NB: NOT A MEDIA FILE TOKEN, but should be fine. API callers can't pass this around to other
  // media file endpoints (unless we want to emulate the behavior in all endpoints, which we don't)
  let token = MediaFileToken::new_from_str(&result.tts_result_token);

  Ok(GetMediaFileSuccessResponse {
    success: true,
    media_file: MediaFile {
      token,
      media_type: MediaFileType::Audio, // NB: Always audio
      public_bucket_path,
      maybe_creator_user: UserDetailsLight::from_optional_db_fields_owned(
        result.maybe_creator_user_token,
        result.maybe_creator_username,
        result.maybe_creator_display_name,
        result.maybe_creator_gravatar_hash,
      ),
      creator_set_visibility: result.creator_set_visibility,
      is_emulated_media_file: true,
      created_at: result.created_at,
      updated_at: result.updated_at,
    },
  })
}
