use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_file_cover_image_details_builder::MediaFileCoverImageDetailsBuilder;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::user_details_lite_builder::UserDetailsLightBuilder;
use crate::http_server::endpoints::media_files::common_responses::live_portrait_builder::MediaFileLivePortraitDetailsBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::bucket_urls::bucket_url_from_media_path::bucket_url_from_media_path;
use crate::http_server::web_utils::bucket_urls::bucket_url_from_str_path::bucket_url_from_str_path;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest, HttpResponse};
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use artcraft_api_defs::common::responses::simple_entity_stats::SimpleEntityStats;
use artcraft_api_defs::media_files::get_media_file::{GetMediaFileModelInfo, GetMediaFileModeratorFields, GetMediaFileSuccessResponse, MediaFileInfo};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use chrono::{DateTime, Utc};
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_subtype::MediaFileSubtype;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use log::warn;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::tts::tts_results::query_tts_result::select_tts_result_by_token;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use url::Url;
use utoipa::ToSchema;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetMediaFilePathInfo {
  token: MediaFileToken,
}

#[derive(Debug, ToSchema)]
pub enum GetMediaFileError {
  ServerError,
  NotFound,
}

impl ResponseError for GetMediaFileError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetMediaFileError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetMediaFileError::NotFound => StatusCode::NOT_FOUND,
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

/// Get a single media file by token.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/file/{token}",
  responses(
    (status = 200, description = "Found", body = GetMediaFileSuccessResponse),
    (status = 404, description = "Not found", body = GetMediaFileError),
    (status = 500, description = "Server error", body = GetMediaFileError),
  ),
  params(
    ("path" = GetMediaFilePathInfo, description = "Path for Request")
  )
)]
pub async fn get_media_file_handler(
  http_request: HttpRequest,
  path: Path<GetMediaFilePathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GetMediaFileSuccessResponse>, GetMediaFileError> {
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

  let media_domain = get_media_domain(&http_request);

  // NB(bt,2023-11-27): We're moving TT2 results over to the `media_files` table, originally from
  // the `tts_results_table`. We're emulating media files (for viewing) to support API clients
  // (eg. the AI streamer shows).
  let response = if media_file_token.0.starts_with("TR:") {
    // NB: This is the exceptional case, where we emulate results in the `tts_results` table as media files
    emulate_media_file_with_legacy_tts_result_lookup(
      &media_file_token,
      show_deleted_results,
      &server_state,
      media_domain,
    ).await?
  } else {
    modern_media_file_lookup(
      &media_file_token,
      show_deleted_results,
      &server_state,
      media_domain
    ).await?
  };

  Ok(Json(response))
}

async fn modern_media_file_lookup(
  media_file_token: &MediaFileToken,
  show_deleted_results: bool,
  server_state: &ServerState,
  media_domain: MediaDomain,
) -> Result<GetMediaFileSuccessResponse, GetMediaFileError> {

  let is_mod = show_deleted_results;

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

  let public_bucket_path = MediaFileBucketPath::from_object_hash(
    &result.public_bucket_directory_hash,
    result.maybe_public_bucket_prefix.as_deref(),
    result.maybe_public_bucket_extension.as_deref());

  let maybe_cover_image_public_bucket_path = match result.maybe_model_cover_image_public_bucket_hash
      .as_deref()
  {
    None => None,
    Some(hash) => Some(MediaFileBucketPath::from_object_hash(
      &hash,
      result.maybe_model_cover_image_public_bucket_prefix.as_deref(),
      result.maybe_model_cover_image_public_bucket_extension.as_deref())
        .get_full_object_path_str()
        .to_string()
    )
  };

  // NB: Some engine pages will need to know the engine extension to load the file.
  let maybe_engine_extension = match result.media_type {
    MediaFileType::Bvh => Some(".bvh".to_string()),
    MediaFileType::Glb => Some(".glb".to_string()),
    MediaFileType::Gltf => Some(".gltf".to_string()),
    MediaFileType::SceneRon => Some(".scn.ron".to_string()),
    _ => None,
  };

  Ok(GetMediaFileSuccessResponse {
    success: true,
    media_file: MediaFileInfo {
      token: result.token.clone(),
      media_class: result.media_class,
      media_type: result.media_type,
      maybe_engine_category: result.maybe_engine_category,
      maybe_animation_type: result.maybe_animation_type,
      // maybe_media_subtype: result.maybe_media_subtype,
      maybe_media_subtype: None, // NB(bt,2024-07-25): Stop populating field for consumers.
      maybe_engine_extension,
      maybe_batch_token: result.maybe_batch_token,
      maybe_scene_source_media_file_token: result.maybe_scene_source_media_file_token,
      media_links: MediaLinksBuilder::from_media_path_and_env(media_domain, server_state.server_environment, &public_bucket_path),
      public_bucket_url: bucket_url_from_media_path(&public_bucket_path)
          .map_err(|err| {
            warn!("error creating URL: {:?}", err);
            GetMediaFileError::ServerError
          })?,
      public_bucket_path: public_bucket_path
          .get_full_object_path_str()
          .to_string(),
      cover_image: MediaFileCoverImageDetailsBuilder::from_optional_db_fields(
        &result.token,
        media_domain,
        result.maybe_file_cover_image_public_bucket_hash.as_deref(),
        result.maybe_file_cover_image_public_bucket_prefix.as_deref(),
        result.maybe_file_cover_image_public_bucket_extension.as_deref(),
      ),
      maybe_title: result.maybe_title,
      maybe_text_transcript: result.maybe_text_transcript,
      maybe_live_portrait_details: result.extra_media_file_info
          .as_ref()
          .map(|info| MediaFileLivePortraitDetailsBuilder::maybe_from_extra_info(&info))
          .flatten(),
      maybe_style_name: result.maybe_prompt_args
          .as_ref()
          .and_then(|args| args.style_name.as_ref())
          .and_then(|style| style.to_style_name()),
      used_face_detailer: result.maybe_prompt_args
          .as_ref()
          .and_then(|args| args.used_face_detailer)
          .unwrap_or(false),
      used_upscaler: result.maybe_prompt_args
          .as_ref()
          .and_then(|args| args.used_upscaler)
          .unwrap_or(false),
      maybe_model_weight_info: match result.maybe_model_weights_token {
        None => None,
        Some(weight_token) => Some(GetMediaFileModelInfo {
          weight_token,
          // TODO(bt,2023-12-28): Instead of giving bogus defaults on None, make these optional or return
          //  None for *everything* on any field being absent.
          weight_type: PublicWeightsType::from_enum(result.maybe_model_weights_type.unwrap_or(WeightsType::Tacotron2)),
          weight_category: result.maybe_model_weights_category.unwrap_or(WeightsCategory::TextToSpeech),
          title: result.maybe_model_weights_title.unwrap_or_else(|| "model".to_string()),
          maybe_cover_image_public_bucket_path,
          maybe_weight_creator: UserDetailsLightBuilder::from_optional_db_fields_owned(
            result.maybe_model_weight_creator_user_token,
            result.maybe_model_weight_creator_username,
            result.maybe_model_weight_creator_display_name,
            result.maybe_model_weight_creator_gravatar_hash,
          ),
        })
      },
      maybe_creator_user: UserDetailsLightBuilder::from_optional_db_fields_owned(
        result.maybe_creator_user_token,
        result.maybe_creator_username,
        result.maybe_creator_display_name,
        result.maybe_creator_gravatar_hash,
      ),
      creator_set_visibility: result.creator_set_visibility,
      is_user_upload: result.is_user_upload,
      is_intermediate_system_file: result.is_intermediate_system_file,
      maybe_prompt_token: result.maybe_prompt_token,
      maybe_original_filename: result.maybe_origin_filename,
      maybe_duration_millis: result.maybe_duration_millis,
      is_emulated_media_file: false,
      is_featured: result.is_featured,
      stats: SimpleEntityStats {
        positive_rating_count: result.maybe_ratings_positive_count.unwrap_or(0),
        bookmark_count: result.maybe_bookmark_count.unwrap_or(0),
      },
      created_at: result.created_at,
      updated_at: result.updated_at,
      maybe_moderator_fields: if is_mod {
        Some(GetMediaFileModeratorFields {
          maybe_style_transfer_source_media_file_token: result.maybe_style_transfer_source_media_file_token,
        })
      } else {
        None
      },
    },
  })
}

async fn emulate_media_file_with_legacy_tts_result_lookup(
  media_file_token: &MediaFileToken,
  show_deleted_results: bool,
  server_state: &ServerState,
  media_domain: MediaDomain,
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
    media_file: MediaFileInfo {
      token,
      media_class: MediaFileClass::Audio, // NB: Always audio
      media_type: MediaFileType::Audio, // NB: Always audio
      maybe_engine_category: None,
      maybe_animation_type: None,
      maybe_media_subtype: None,
      maybe_engine_extension: None,
      maybe_batch_token: None,
      maybe_scene_source_media_file_token: None,
      media_links: MediaLinksBuilder::from_rooted_path_and_env(media_domain, server_state.server_environment, &public_bucket_path),
      public_bucket_url: bucket_url_from_str_path(&public_bucket_path)
          .map_err(|err| {
            warn!("error creating URL: {:?}", err);
            GetMediaFileError::ServerError
          })?,
      public_bucket_path,
      cover_image: MediaFileCoverImageDetailsBuilder::from_token_str(&result.tts_result_token),
      maybe_model_weight_info: Some(GetMediaFileModelInfo {
        // NB: These should be reasonable synthetic defaults for emulated TT2 results, even the "ModelWeightToken".
        weight_token: ModelWeightToken::new_from_str(&result.tts_model_token),
        weight_type: PublicWeightsType::Tacotron2,
        weight_category: WeightsCategory::TextToSpeech,
        title: result.tts_model_title.unwrap_or_else(|| "tacotron2 model".to_string()),
        maybe_cover_image_public_bucket_path: None,
        maybe_weight_creator: None, // NB: Not worth the trouble of synthesizing this
      }),
      maybe_creator_user: UserDetailsLightBuilder::from_optional_db_fields_owned(
        result.maybe_creator_user_token,
        result.maybe_creator_username,
        result.maybe_creator_display_name,
        result.maybe_creator_gravatar_hash,
      ),
      maybe_live_portrait_details: None,
      maybe_prompt_token: None,
      maybe_style_name: None,
      used_face_detailer: false,
      used_upscaler: false,
      creator_set_visibility: result.creator_set_visibility,
      is_user_upload: false,
      is_intermediate_system_file: false,
      maybe_title: None,
      maybe_text_transcript: Some(result.raw_inference_text),
      maybe_original_filename: None,
      maybe_duration_millis: None,
      is_emulated_media_file: true,
      is_featured: false,
      stats: SimpleEntityStats {
        positive_rating_count: 0,
        bookmark_count: 0,
      },
      created_at: result.created_at,
      updated_at: result.updated_at,
      maybe_moderator_fields: None,
    },
  })
}
