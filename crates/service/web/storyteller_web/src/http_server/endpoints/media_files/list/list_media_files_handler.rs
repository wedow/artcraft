use std::sync::Arc;

use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Query;
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::view_as::ViewAs;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::media_files::public_media_file_model_type::PublicMediaFileModelType;
use mysql_queries::queries::media_files::list::list_media_files::{list_media_files, ListMediaFilesArgs};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::media_file_cover_image_details::{MediaFileCoverImageDetails, MediaFileDefaultCover};
use crate::http_server::common_responses::media_file_origin_details::MediaFileOriginDetails;
use crate::http_server::common_responses::pagination_cursors::PaginationCursors;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_scoped_engine_categories::get_scoped_engine_categories;
use crate::http_server::endpoints::media_files::helpers::get_scoped_media_classes::get_scoped_media_classes;
use crate::http_server::endpoints::media_files::helpers::get_scoped_media_types::get_scoped_media_types;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use crate::util::allowed_explore_media_access::allowed_explore_media_access;
use crate::util::allowed_studio_access::allowed_studio_access;

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListMediaFilesQueryParams {
  pub sort_ascending: Option<bool>,
  pub page_size: Option<usize>,
  pub cursor: Option<String>,
  pub cursor_is_reversed: Option<bool>,

  /// NB: This can be one (or more comma-separated values) from `MediaFileClass`,
  /// which are the broad category of media files: image, video, etc.
  ///
  /// Usage:
  ///   - `?filter_media_classes=audio`
  ///   - `?filter_media_classes=image,video`
  ///   - etc.
  pub filter_media_classes: Option<String>,

  /// NB: This can be one (or more comma-separated values) from `MediaFileType`,
  /// which are mimetype-like / format-like categories of media files: glb, gltf,
  /// scene_json, etc.
  ///
  /// Usage:
  ///   - `?filter_media_type=scene_json`
  ///   - `?filter_media_type=glb,gltf`
  ///   - etc.
  pub filter_media_type: Option<String>,

  /// NB: This can be one (or more comma-separated values) from `MediaFileEngineCategory`.
  ///
  /// Usage:
  ///   - `?filter_engine_categories=scene`
  ///   - `?filter_engine_categories=animation,character,object`
  ///   - etc.
  pub filter_engine_categories: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct ListMediaFilesSuccessResponse {
  pub success: bool,
  pub results: Vec<MediaFileListItem>,
  pub pagination: PaginationCursors,
}

#[derive(Serialize, ToSchema)]
pub struct MediaFileListItem {
  pub token: MediaFileToken,

  /// The coarse-grained class of media file: image, video, etc.
  pub media_class: MediaFileClass,

  /// Type of media will dictate which fields are populated and what
  /// the frontend should display (eg. video player vs audio player).
  /// This is closer in meaning to a "mime type".
  pub media_type: MediaFileType,

  /// If this is an engine/3D asset, this is the broad category (scene,
  /// animation, etc.) of that object.
  /// This can also be used for filtering in list/batch endpoints.
  pub maybe_engine_category: Option<MediaFileEngineCategory>,

  /// If this is an engine/3D asset for an animation or a rig that can
  /// be animated with either (or both) skeletal or blend shape animations,
  /// this describes the animation regime used or supported.
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub origin_category: MediaFileOriginCategory,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub origin_product_category: MediaFileOriginProductCategory,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub maybe_origin_model_type: Option<PublicMediaFileModelType>,

  #[deprecated(note="Use MediaFileOriginDetails instead")]
  pub maybe_origin_model_token: Option<String>,

  /// Details where the media file came from.
  pub origin: MediaFileOriginDetails,

  /// URL to the media file.
  pub public_bucket_path: String,

  /// Information about the cover image. Many media files do not require a cover image,
  /// e.g. image files, video files with thumbnails, audio files, etc.
  /// 3D files require them.
  pub cover_image: MediaFileCoverImageDetails,

  pub maybe_creator: Option<UserDetailsLight>,

  /// Statistics about the media file
  pub stats: SimpleEntityStats,

  pub creator_set_visibility: Visibility,

  /// The name or title of the media file (optional)
  pub maybe_title: Option<String>,

  /// Text transcripts for TTS, etc.
  pub maybe_text_transcript: Option<String>,

  /// For Comfy / Video Style Transfer jobs, this might include
  /// the name of the selected style.
  pub maybe_style_name: Option<StyleTransferName>,

  /// Duration for audio and video files, if available.
  /// Measured in milliseconds.
  pub maybe_duration_millis: Option<u64>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, ToSchema)]
pub enum ListMediaFilesError {
  ServerError,
  NotAuthorized,
}

impl ResponseError for ListMediaFilesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListMediaFilesError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      ListMediaFilesError::NotAuthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListMediaFilesError::ServerError => "server error".to_string(),
      ListMediaFilesError::NotAuthorized => "not authorized".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

impl std::fmt::Display for ListMediaFilesError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// List all media files in the system globally, across all users (paginated).
///
/// This powers "explore files" page.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/list",
  params(ListMediaFilesQueryParams),
  responses(
    (status = 200, description = "List Featured Media Files", body = ListMediaFilesSuccessResponse),
    (status = 500, description = "Server error", body = ListMediaFilesError),
  ),
)]
pub async fn list_media_files_handler(
    http_request: HttpRequest,
    query: Query<ListMediaFilesQueryParams>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListMediaFilesError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListMediaFilesError::ServerError
      })?;

  // ==================== FEATURE FLAG CHECK ==================== //

  if !allowed_explore_media_access(maybe_user_session.as_ref()) {
    warn!("Explore media access is not permitted for user");
    return Err(ListMediaFilesError::NotAuthorized);
  }

  let mut is_mod = false;

  match maybe_user_session {
    None => {},
    Some(session) => {
      is_mod = session.can_ban_users;
    },
  };

  // TODO(bt,2023-12-04): Enforce real maximums and defaults
  let limit = query.page_size.unwrap_or(25);

  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

  let cursor = if let Some(cursor) = query.cursor.as_deref() {
    let cursor = server_state.sort_key_crypto.decrypt_id(cursor)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListMediaFilesError::ServerError
        })?;
    Some(cursor as usize)
  } else {
    None
  };

  let view_as = if is_mod {
    ViewAs::Moderator
  } else {
    ViewAs::AnotherUser
  };

  let mut maybe_filter_media_types = get_scoped_media_types(query.filter_media_type.as_deref());
  let mut maybe_filter_media_classes  = get_scoped_media_classes(query.filter_media_classes.as_deref());
  let mut maybe_filter_engine_categories = get_scoped_engine_categories(query.filter_engine_categories.as_deref());

  let query_results = list_media_files(ListMediaFilesArgs {
    limit,
    maybe_filter_media_types: maybe_filter_media_types.as_ref(),
    maybe_filter_media_classes: maybe_filter_media_classes.as_ref(),
    maybe_filter_engine_categories: maybe_filter_engine_categories.as_ref(),
    maybe_offset: cursor,
    cursor_is_reversed,
    sort_ascending,
    view_as,
    mysql_pool: &server_state.mysql_pool,
  }).await;


  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListMediaFilesError::ServerError);
    }
  };

  let cursor_next = if let Some(id) = results_page.last_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListMediaFilesError::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let cursor_previous = if let Some(id) = results_page.first_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListMediaFilesError::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let results = results_page.records.into_iter()
      .map(|record| MediaFileListItem {
        token: record.token.clone(),
        media_class: record.media_class,
        media_type: record.media_type,
        maybe_engine_category: record.maybe_engine_category,
        maybe_animation_type: record.maybe_animation_type,
        origin: MediaFileOriginDetails::from_db_fields_str(
          record.origin_category,
          record.origin_product_category,
          record.maybe_origin_model_type,
          record.maybe_origin_model_token.as_deref(),
          record.maybe_origin_model_title.as_deref()),
        origin_category: record.origin_category,
        origin_product_category: record.origin_product_category,
        maybe_origin_model_type: record.maybe_origin_model_type
            .map(|m| PublicMediaFileModelType::from_enum(m)),
        maybe_origin_model_token: record.maybe_origin_model_token,
        public_bucket_path: MediaFileBucketPath::from_object_hash(
          &record.public_bucket_directory_hash,
          record.maybe_public_bucket_prefix.as_deref(),
          record.maybe_public_bucket_extension.as_deref())
            .get_full_object_path_str()
            .to_string(),
        cover_image: MediaFileCoverImageDetails::from_optional_db_fields(
          &record.token,
          record.maybe_file_cover_image_public_bucket_hash.as_deref(),
          record.maybe_file_cover_image_public_bucket_prefix.as_deref(),
          record.maybe_file_cover_image_public_bucket_extension.as_deref(),
        ),
        maybe_creator: UserDetailsLight::from_optional_db_fields_owned(
          record.maybe_creator_user_token,
          record.maybe_creator_username,
          record.maybe_creator_display_name,
          record.maybe_creator_gravatar_hash,
        ),
        stats: SimpleEntityStats {
          positive_rating_count: record.maybe_ratings_positive_count.unwrap_or(0),
          bookmark_count: record.maybe_bookmark_count.unwrap_or(0),
        },
        creator_set_visibility: record.creator_set_visibility,
        maybe_title: record.maybe_title,
        maybe_text_transcript: record.maybe_text_transcript,
        maybe_style_name: record.maybe_prompt_args
            .as_ref()
            .and_then(|args| args.style_name.as_ref())
            .and_then(|style| style.to_style_name()),
        maybe_duration_millis: record.maybe_duration_millis,
        created_at: record.created_at,
        updated_at: record.updated_at,
      })
      .collect::<Vec<_>>();

  let response = ListMediaFilesSuccessResponse {
    success: true,
    results,
    pagination: PaginationCursors {
      maybe_next: cursor_next,
      maybe_previous: cursor_previous,
      cursor_is_reversed,
    }
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListMediaFilesError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
