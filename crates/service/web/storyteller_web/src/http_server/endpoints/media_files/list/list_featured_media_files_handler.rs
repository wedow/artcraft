use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Query;
use chrono::{DateTime, Utc};
use log::{debug, error, warn};
use r2d2_redis::redis::Commands;
use utoipa::{IntoParams, ToSchema};

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::view_as::ViewAs;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::media_files::public_media_file_model_type::PublicMediaFileModelType;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::batch_get_media_files_by_tokens;
use mysql_queries::queries::media_files::list::list_featured_media_files::{FeaturedMediaFileListPage, list_featured_media_files, ListFeaturedMediaFilesArgs};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::media_file_cover_image_details::{MediaFileCoverImageDetails, MediaFileDefaultCover};
use crate::http_server::common_responses::media_file_origin_details::MediaFileOriginDetails;
use crate::http_server::common_responses::pagination_cursors::PaginationCursors;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_scoped_engine_categories::get_scoped_engine_categories;
use crate::http_server::endpoints::media_files::helpers::get_scoped_media_classes::get_scoped_media_classes;
use crate::http_server::endpoints::media_files::helpers::get_scoped_media_types::get_scoped_media_types;
use crate::state::server_state::ServerState;
use crate::util::allowed_explore_media_access::allowed_explore_media_access;

#[derive(Deserialize, ToSchema, IntoParams, Hash, Clone, PartialEq, Eq)]
pub struct ListFeaturedMediaFilesQueryParams {
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
pub struct ListFeaturedMediaFilesSuccessResponse {
  pub success: bool,
  pub results: Vec<FeaturedMediaFile>,
  pub pagination: PaginationCursors,
}

#[derive(Serialize, ToSchema)]
pub struct FeaturedMediaFile {
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

  /// URL to the media file
  pub public_bucket_path: String,

  /// Information about the cover image. Many media files do not require a cover image,
  /// e.g. image files, video files with thumbnails, audio files, etc.
  /// 3D files require them.
  pub cover_image: MediaFileCoverImageDetails,

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

  pub maybe_creator: Option<UserDetailsLight>,

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

  /// Statistics about the media file
  pub stats: SimpleEntityStats,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, ToSchema)]
pub enum ListFeaturedMediaFilesError {
  NotAuthorized,
  ServerError,
}

impl std::fmt::Display for ListFeaturedMediaFilesError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListFeaturedMediaFilesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListFeaturedMediaFilesError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListFeaturedMediaFilesError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

/// List media files that were featured or promoted by the staff (paginated). This will power our global asset drawers and highlight reels.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/list_featured",
  params(ListFeaturedMediaFilesQueryParams),
  responses(
    (status = 200, description = "List Featured Media Files", body = ListFeaturedMediaFilesSuccessResponse),
    (status = 401, description = "Not authorized", body = ListFeaturedMediaFilesError),
    (status = 500, description = "Server error", body = ListFeaturedMediaFilesError),
  ),
)]
pub async fn list_featured_media_files_handler(
  http_request: HttpRequest,
  query: Query<ListFeaturedMediaFilesQueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListFeaturedMediaFilesError> {

  let maybe_cached_results  = server_state
      .caches
      .ephemeral
      .featured_media_files_sieve
      .get_copy(&query)
      .ok()
      .flatten();

  let mut is_from_cache = maybe_cached_results.is_some();

  let results_page = match maybe_cached_results {
    Some(cached_results) => cached_results,
    None => database_lookup(&query, &server_state).await?,
  };

  let cursor_next = if let Some(id) = results_page.last_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListFeaturedMediaFilesError::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  let cursor_previous = if let Some(id) = results_page.first_id {
    let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListFeaturedMediaFilesError::ServerError
        })?;
    Some(cursor)
  } else {
    None
  };

  // TODO(bt,2023-12-04): Enforce real maximums and defaults
  let limit = query.page_size.unwrap_or(25);

  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

  let results = results_page.records.into_iter()
      .map(|m| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &m.public_bucket_directory_hash,
          m.maybe_public_bucket_prefix.as_deref(),
          m.maybe_public_bucket_extension.as_deref())
            .get_full_object_path_str()
            .to_string();

        FeaturedMediaFile {
          token: m.token.clone(),
          media_class: m.media_class,
          media_type: m.media_type,
          maybe_engine_category: m.maybe_engine_category,
          maybe_animation_type: m.maybe_animation_type,
          public_bucket_path,
          cover_image: MediaFileCoverImageDetails::from_optional_db_fields(
            &m.token,
            m.maybe_file_cover_image_public_bucket_hash.as_deref(),
            m.maybe_file_cover_image_public_bucket_prefix.as_deref(),
            m.maybe_file_cover_image_public_bucket_extension.as_deref(),
          ),
          origin: MediaFileOriginDetails::from_db_fields_str(
            m.origin_category,
            m.origin_product_category,
            m.maybe_origin_model_type,
            m.maybe_origin_model_token.as_deref(),
            m.maybe_origin_model_title.as_deref()),
          origin_category: m.origin_category,
          origin_product_category: m.origin_product_category,
          maybe_origin_model_type: m.maybe_origin_model_type
              .map(|t| PublicMediaFileModelType::from_enum(t)),
          maybe_origin_model_token: m.maybe_origin_model_token,
          maybe_creator: UserDetailsLight::from_optional_db_fields_owned(
            m.maybe_creator_user_token,
            m.maybe_creator_username,
            m.maybe_creator_display_name,
            m.maybe_creator_gravatar_hash
          ),
          maybe_title: m.maybe_title,
          maybe_text_transcript: m.maybe_text_transcript,
          maybe_style_name: m.maybe_prompt_args
              .as_ref()
              .and_then(|args| args.style_name.as_ref())
              .and_then(|style| style.to_style_name()),
          maybe_duration_millis: m.maybe_duration_millis,
          stats: SimpleEntityStats {
            positive_rating_count: m.maybe_ratings_positive_count.unwrap_or(0),
            bookmark_count: m.maybe_bookmark_count.unwrap_or(0),
          },
          created_at: m.created_at,
          updated_at: m.updated_at,
        }
      }).collect::<Vec<_>>();

  let response = ListFeaturedMediaFilesSuccessResponse {
    success: true,
    results,
    pagination: PaginationCursors {
      maybe_next: cursor_next,
      maybe_previous: cursor_previous,
      cursor_is_reversed,
    }
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListFeaturedMediaFilesError::ServerError)?;

  let mut response_builder = HttpResponse::Ok();

  if is_from_cache {
    // NB: Temporary debugging
    response_builder.insert_header(("x-sieve", "true"));
  }

  Ok(response_builder
      .content_type("application/json")
      .body(body))
}

async fn database_lookup(
  query: &ListFeaturedMediaFilesQueryParams,
  server_state: &ServerState,
) -> Result<FeaturedMediaFileListPage, ListFeaturedMediaFilesError> {

  // TODO(bt,2023-12-04): Enforce real maximums and defaults
  let limit = query.page_size.unwrap_or(25);

  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

  let cursor = if let Some(cursor) = query.cursor.as_deref() {
    let cursor = server_state.sort_key_crypto.decrypt_id(cursor)
        .map_err(|e| {
          warn!("crypto error: {:?}", e);
          ListFeaturedMediaFilesError::ServerError
        })?;
    Some(cursor as usize)
  } else {
    None
  };

  let mut maybe_filter_media_types = get_scoped_media_types(query.filter_media_type.as_deref());
  let mut maybe_filter_media_classes  = get_scoped_media_classes(query.filter_media_classes.as_deref());
  let mut maybe_filter_engine_categories = get_scoped_engine_categories(query.filter_engine_categories.as_deref());

  // NB: No reason to show deleted or non-public featured items to mods or authors.
  //  That's just confusing and wastes an extra query.
  const VIEW_AS: ViewAs = ViewAs::AnotherUser;

  let results = list_featured_media_files(ListFeaturedMediaFilesArgs {
    limit,
    maybe_offset: cursor,
    cursor_is_reversed,
    sort_ascending,
    view_as: VIEW_AS,
    maybe_filter_media_types: maybe_filter_media_types.as_ref(),
    maybe_filter_media_classes: maybe_filter_media_classes.as_ref(),
    maybe_filter_engine_categories: maybe_filter_engine_categories.as_ref(),
    mysql_pool: &server_state.mysql_pool,
  }).await.map_err(|err| {
    error!("DB error: {:?}", err);
    ListFeaturedMediaFilesError::ServerError
  })?;

  // NB: Fail open.
  let _result = server_state
      .caches
      .ephemeral
      .featured_media_files_sieve
      .store_copy(&query, &results);

  Ok(results)
}