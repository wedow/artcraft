use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use chrono::{DateTime, Utc};
use log::{debug, error, warn};
use r2d2_redis::redis::Commands;
use utoipa::ToSchema;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_type::MediaFileType;
use mysql_queries::queries::media_files::list::list_media_files_by_tokens::list_media_files_by_tokens;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct ListFeaturedMediaFilesSuccessResponse {
  pub success: bool,
  pub media_files: Vec<MediaFile>,
}

#[derive(Serialize, ToSchema)]
pub struct MediaFile {
  pub token: MediaFileToken,

  /// Type of media will dictate which fields are populated and what
  /// the frontend should display (eg. video player vs audio player).
  pub media_type: MediaFileType,

  /// URL to the media file
  pub public_bucket_path: String,

  // TODO: Provenance data - hide some of the models we use, especially zero shot.
  //pub origin_category: MediaFileOriginCategory,
  //pub origin_product_category: MediaFileOriginProductCategory,
  //pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  //pub maybe_origin_model_token: Option<String>,

  pub maybe_creator: Option<UserDetailsLight>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// The key we store featured media file tokens under
const REDIS_KEY : &str = "featured_media_files_list";

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

#[utoipa::path(
  get,
  path = "/v1/media_files/list_featured",
  responses(
    (status = 200, description = "List Featured Media Files", body = ListFeaturedMediaFilesSuccessResponse),
    (status = 401, description = "Not authorized", body = ListFeaturedMediaFilesError),
    (status = 500, description = "Server error", body = ListFeaturedMediaFilesError),
  ),
)]
pub async fn list_featured_media_files_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, impl ResponseError> {

  let mut redis = server_state.redis_pool.get()
      .map_err(|err| {
        error!("Could not obtain redis: {err}");
        ListFeaturedMediaFilesError::ServerError
      })?;

  let token_list : Option<String> = redis.get(REDIS_KEY)
      .map_err(|err| {
        error!("Could not get redis result: {err}");
        ListFeaturedMediaFilesError::ServerError
      })?;

  let media_file_tokens = token_list
      .unwrap_or_else(|| "".to_string())
      .split(",")
      .into_iter()
      .map(|item| item.trim())
      .filter(|item| !item.is_empty())
      .map(|item| MediaFileToken::new_from_str(item))
      .collect::<Vec<MediaFileToken>>();

  debug!("Weight tokens from Redis: {:?}", media_file_tokens);

  let mut media_files = Vec::new();

  if !media_file_tokens.is_empty() {
    let query_results =
        list_media_files_by_tokens(&server_state.mysql_pool, &media_file_tokens, false).await;

    media_files = match query_results {
      Ok(media_files) => media_files,
      Err(e) => {
        warn!("Query error: {:?}", e);
        return Err(ListFeaturedMediaFilesError::ServerError);
      }
    };
  }

  let response = ListFeaturedMediaFilesSuccessResponse {
    success: true,
    media_files: media_files.into_iter()
        .map(|m| {
          let public_bucket_path = MediaFileBucketPath::from_object_hash(
            &m.public_bucket_directory_hash,
            m.maybe_public_bucket_prefix.as_deref(),
            m.maybe_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string();

          MediaFile {
            token: m.token,
            media_type: m.media_type,
            public_bucket_path,
            //origin_category: m.origin_category,
            //origin_product_category: m.origin_product_category,
            //maybe_origin_model_type: m.maybe_origin_model_type,
            //maybe_origin_model_token: m.maybe_origin_model_token,
            maybe_creator: UserDetailsLight::from_optional_db_fields_owned(
              m.maybe_creator_user_token,
              m.maybe_creator_username,
              m.maybe_creator_display_name,
              m.maybe_creator_email_gravatar_hash
            ),
            created_at: m.created_at,
            updated_at: m.updated_at,
          }
        }).collect::<Vec<_>>(),
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListFeaturedMediaFilesError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
