// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Query};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use mysql_queries::queries::user_bookmarks::list_user_bookmarks::{list_user_bookmarks, list_user_user_bookmarks_by_entity_type};
use tokens::tokens::user_bookmarks::UserBookmarkToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct ListUserBookmarksPathInfo {
  username: String,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListUserBookmarksQueryData {
  maybe_scoped_entity_type: Option<UserBookmarkEntityType>,
}

#[derive(Serialize, ToSchema)]
pub struct ListUserBookmarksForUserSuccessResponse {
  pub success: bool,
  pub user_bookmarks: Vec<UserBookmarkListItem>,
}

#[derive(Serialize, ToSchema)]
pub struct UserBookmarkListItem {
  pub token: UserBookmarkToken,

  pub details: UserBookmarkDetailsForUserList,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, ToSchema)]
pub struct UserBookmarkDetailsForUserList {
  // TODO: This needs titles or some other summary metadata.
  pub entity_type: UserBookmarkEntityType,
  pub entity_token: String,

  // TODO: Populate this for TTS
  pub maybe_summary_text: Option<String>,

  // TODO: Populate this for images, video, etc.
  pub maybe_thumbnail_url: Option<String>,
}

#[derive(Debug, ToSchema)]
pub enum ListUserBookmarksForUserError {
  ServerError,
}

impl ResponseError for ListUserBookmarksForUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListUserBookmarksForUserError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListUserBookmarksForUserError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListUserBookmarksForUserError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  get,
  path = "/v1/user_bookmarks/list/user/{username}",
  params(
  ("username", description = "The username of the user whose bookmarks to list."),
    ListUserBookmarksQueryData
  ),
responses(
  (status = 200, description = "List User Bookmarks", body = ListUserBookmarksForUserSuccessResponse),
  (status = 500, description = "Server error", body = ListUserBookmarksForUserError),
),
)]
pub async fn list_user_bookmarks_for_user_handler(
  _http_request: HttpRequest,
  path: Path<ListUserBookmarksPathInfo>,
  query: Query<ListUserBookmarksQueryData>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListUserBookmarksForUserError>
{

  let query_results = match query.maybe_scoped_entity_type {
    None => list_user_bookmarks(&path.username, &server_state.mysql_pool).await,
    Some(entity_type) =>
      list_user_user_bookmarks_by_entity_type(&path.username, entity_type, &server_state.mysql_pool)
          .await,
  };

  let user_bookmarks = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Query error: {:?}", e);
      return Err(ListUserBookmarksForUserError::ServerError);
    }
  };

  let response = ListUserBookmarksForUserSuccessResponse {
    success: true,
    user_bookmarks: user_bookmarks.into_iter()
        .map(|user_bookmark| UserBookmarkListItem {
          token: user_bookmark.token,
          details: UserBookmarkDetailsForUserList {
            entity_type: user_bookmark.entity_type,
            entity_token: user_bookmark.entity_token,
            maybe_summary_text: user_bookmark.maybe_entity_descriptive_text,
            // TODO(bt,2023-11-21): Thumbnails need proper support. We should build them as a
            //  first-class system before handling the backfill here.
            maybe_thumbnail_url: None,
          },
          created_at: user_bookmark.created_at,
          updated_at: user_bookmark.updated_at,
        })
        .collect(),
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| ListUserBookmarksForUserError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
