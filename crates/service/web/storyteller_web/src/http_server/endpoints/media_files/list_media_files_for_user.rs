use std::sync::Arc;

use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Query};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use mysql_queries::queries::media_files::list::list_media_files_for_user::{list_media_files_for_user, ListMediaFileForUserArgs, ViewAs};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct ListMediaFilesForUserPathInfo {
  username: String,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListMediaFilesForUserQueryParams {
  pub sort_ascending: Option<bool>,
  pub page_size: Option<usize>,
  pub page_index: Option<usize>,
  pub filter_media_type: Option<MediaFileType>,
}

#[derive(Serialize, ToSchema)]
pub struct ListMediaFilesForUserSuccessResponse {
  pub success: bool,
  pub results: Vec<MediaFileForUserListItem>,
  pub pagination: PaginationPage,
}

#[derive(Serialize, ToSchema)]
pub struct MediaFileForUserListItem {
  pub token: MediaFileToken,

  pub origin_category: MediaFileOriginCategory,
  pub origin_product_category: MediaFileOriginProductCategory,
  pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  pub maybe_origin_model_token: Option<String>,

  pub media_type: MediaFileType,

  /// URL to the media file.
  pub public_bucket_path: String,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, ToSchema)]
pub enum ListMediaFilesForUserError {
  ServerError,
}

impl ResponseError for ListMediaFilesForUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListMediaFilesForUserError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListMediaFilesForUserError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

impl std::fmt::Display for ListMediaFilesForUserError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  get,
  path = "/v1/media_files/list/user/{username}",
  params(
     ListMediaFilesForUserQueryParams,
  ),
  responses(
    (status = 200, description = "List Featured Media Files", body = ListMediaFilesForUserSuccessResponse),
    (status = 500, description = "Server error", body = ListMediaFilesForUserError),
  ),
)]
pub async fn list_media_files_for_user_handler(
  http_request: HttpRequest,
  path: Path<ListMediaFilesForUserPathInfo>,
  query: Query<ListMediaFilesForUserQueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListMediaFilesForUserError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListMediaFilesForUserError::ServerError
      })?;

  let mut is_author = false;
  let mut is_mod = false;

  match maybe_user_session {
    None => {},
    Some(session) => {
      is_author = session.username == path.username;
      is_mod = session.can_ban_users;
    },
  };

  // TODO(bt,2023-12-04): Enforce real maximums and defaults
  let limit = query.page_size.unwrap_or(25);
  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let page_size = query.page_size.unwrap_or_else(|| 25);
  let page_index = query.page_index.unwrap_or_else(|| 0);

  let view_as = if is_author {
    ViewAs::Author
  } else if is_mod {
    ViewAs::Moderator
  } else {
    ViewAs::AnotherUser
  };


  let query_results = list_media_files_for_user(ListMediaFileForUserArgs {
    username: &path.username,
    maybe_filter_media_type: query.filter_media_type,
    page_size,
    page_index,
    sort_ascending,
    view_as,
    mysql_pool: &server_state.mysql_pool,
  }).await;


  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListMediaFilesForUserError::ServerError);
    }
  };


  let results = results_page.records.into_iter()
      .map(|record| MediaFileForUserListItem {
        token: record.token,
        origin_category: record.origin_category,
        origin_product_category: record.origin_product_category,
        maybe_origin_model_type: record.maybe_origin_model_type,
        maybe_origin_model_token: record.maybe_origin_model_token,
        media_type: record.media_type,
        public_bucket_path: MediaFileBucketPath::from_object_hash(
          &record.public_bucket_directory_hash,
          record.maybe_public_bucket_prefix.as_deref(),
          record.maybe_public_bucket_extension.as_deref())
            .get_full_object_path_str()
            .to_string(),
        creator_set_visibility: record.creator_set_visibility,
        created_at: record.created_at,
        updated_at: record.updated_at,
      })
      .collect::<Vec<_>>();

  let response = ListMediaFilesForUserSuccessResponse {
    success: true,
    results,
    pagination: PaginationPage{
      current: results_page.current_page,
      total_page_count: results_page.total_page_count,
    }
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListMediaFilesForUserError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
