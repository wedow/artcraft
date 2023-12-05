use chrono::{DateTime, Utc};
use sqlx::{MySql, MySqlPool, QueryBuilder};

use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;

pub struct MediaFileListPage {
  pub records: Vec<MediaFileListItem>,

  pub sort_ascending: bool,

  /// ID of the first record.
  pub first_id: Option<i64>,

  /// ID of the last record.
  pub last_id: Option<i64>,
}

pub struct MediaFileListItem {
  pub token: MediaFileToken,

  pub origin_category: MediaFileOriginCategory,
  pub origin_product_category: MediaFileOriginProductCategory,
  pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  pub maybe_origin_model_token: Option<String>,

  pub media_type: MediaFileType,
  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Copy)]
pub enum ViewAs {
  Author,
  Moderator,
  AnotherUser,
}

pub struct ListMediaFilesArgs<'a> {
  pub username: &'a str,
  pub limit: usize,
  pub maybe_filter_media_type: Option<MediaFileType>,
  pub maybe_offset: Option<usize>,
  pub cursor_is_reversed: bool,
  pub view_as: ViewAs,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_media_files(args: ListMediaFilesArgs<'_>) -> AnyhowResult<MediaFileListPage> {

  let mut query = query_builder(
    args.maybe_filter_media_type,
    args.username,
    args.limit,
    args.maybe_offset,
    args.cursor_is_reversed,
    args.view_as,
  );

  let query = query.build_query_as::<MediaFileListItemInternal>();

  let results = query.fetch_all(args.mysql_pool).await?;

  let first_id = results.first()
      .map(|raw_result| raw_result.id);

  let last_id = results.last()
      .map(|raw_result| raw_result.id);

  let results = results.into_iter()
      .map(|record| {
        MediaFileListItem {
          token: record.token,
          origin_category: record.origin_category,
          origin_product_category: record.origin_product_category,
          maybe_origin_model_type: record.maybe_origin_model_type,
          maybe_origin_model_token: record.maybe_origin_model_token,
          media_type: record.media_type,
          public_bucket_directory_hash: record.public_bucket_directory_hash,
          maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: record.maybe_public_bucket_extension,
          creator_set_visibility: record.creator_set_visibility,
          created_at: record.created_at,
          updated_at: record.updated_at,
        }
      })
      .collect::<Vec<_>>();

  Ok(MediaFileListPage {
    records: results,
    sort_ascending: !args.cursor_is_reversed,
    first_id,
    last_id,
  })
}

fn query_builder<'a>(
  maybe_filter_media_type: Option<MediaFileType>,
  username: &'a str,
  limit: usize,
  maybe_offset: Option<usize>,
  cursor_is_reversed: bool,
  view_as: ViewAs,
) -> QueryBuilder<'a, MySql> {

  // NB: Query cannot be statically checked by sqlx
  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    r#"
SELECT
  m.id,
  m.token as `token: tokens::tokens::media_files::MediaFileToken`,

  m.origin_category as `origin_category: enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory`,
  m.origin_product_category as `origin_product_category: enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory`,

  m.maybe_origin_model_type,
  m.maybe_origin_model_token,

  m.media_type as `media_type: enums::by_table::media_files::media_file_type::MediaFileType`,

  m.public_bucket_directory_hash,
  m.maybe_public_bucket_prefix,
  m.maybe_public_bucket_extension,

  m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
  m.created_at,
  m.updated_at

FROM media_files AS m
LEFT OUTER JOIN users AS u
    ON m.maybe_creator_user_token = u.token

WHERE u.username = ?
AND m.user_deleted_at IS NULL
AND m.mod_deleted_at IS NULL
    "#
  );

  query_builder.push_bind(username);

  if let Some(media_type) = maybe_filter_media_type {
    query_builder.push(" AND m.media_file_type = ? ");
    query_builder.push_bind(media_type);
  }

  match view_as {
    ViewAs::Author => {}
    ViewAs::Moderator => {}
    ViewAs::AnotherUser => {
      query_builder.push(" AND m.creator_set_visibility = 'public' ");
    }
  }

  if let Some(offset) = maybe_offset {
    if cursor_is_reversed {
      query_builder.push(format!(" AND m.id < {offset} "));
    } else {
      query_builder.push(format!(" AND m.id > {offset} "));
    }
  }

  if cursor_is_reversed {
    query_builder.push(" ORDER BY m.id ASC ");
  } else {
    query_builder.push(" ORDER BY m.id DESC ");
  }

  query_builder.push(format!(" LIMIT {limit} "));

  query_builder
}

#[derive(sqlx::FromRow)]
struct MediaFileListItemInternal {
  id: i64,
  token: MediaFileToken,

  origin_category: MediaFileOriginCategory,
  origin_product_category: MediaFileOriginProductCategory,
  maybe_origin_model_type: Option<MediaFileOriginModelType>,
  maybe_origin_model_token: Option<String>,

  media_type: MediaFileType,
  public_bucket_directory_hash: String,
  maybe_public_bucket_prefix: Option<String>,
  maybe_public_bucket_extension: Option<String>,

  creator_set_visibility: Visibility,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
}
