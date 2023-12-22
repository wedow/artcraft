use chrono::{DateTime, Utc};
use sqlx::{Acquire, FromRow, MySql, MySqlConnection, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::traits::mysql_from_row::MySqlFromRow;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

#[derive(Serialize)]
pub struct MediaFilesByTokensRecord {
  pub token: MediaFileToken,

  pub media_type: MediaFileType,

  pub origin_category: MediaFileOriginCategory,
  pub origin_product_category: MediaFileOriginProductCategory,
  pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
  pub maybe_origin_model_token: Option<String>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_email_gravatar_hash: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn list_media_files_by_tokens(
  mysql_pool: &MySqlPool,
  media_file_tokens: &[MediaFileToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<MediaFilesByTokensRecord>> {

  let mut connection = mysql_pool.acquire().await?;

  let raw_media_files: Vec<RawMediaFileJoinUser> = get_raw_media_files_by_tokens(&mut connection, media_file_tokens, can_see_deleted).await?;

  Ok(map_to_media_files(raw_media_files))
}

async fn get_raw_media_files_by_tokens(
  connection: &mut MySqlConnection,
  media_file_tokens: &[MediaFileToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<RawMediaFileJoinUser>> {

  let connection = connection.acquire().await?;

  let mut query_builder : QueryBuilder<MySql> = if can_see_deleted {
    QueryBuilder::new(r#"
      SELECT
          m.token,
          m.media_type,

          m.origin_category,
          m.origin_product_category,
          m.maybe_origin_model_type,
          m.maybe_origin_model_token,

          users.token as maybe_creator_user_token,
          users.username as maybe_creator_username,
          users.display_name as maybe_creator_display_name,
          users.email_gravatar_hash as maybe_creator_email_gravatar_hash,

          m.public_bucket_directory_hash,
          m.maybe_public_bucket_prefix,
          m.maybe_public_bucket_extension,

          m.created_at,
          m.updated_at

      FROM media_files as m
      LEFT OUTER JOIN users
          ON users.token = m.maybe_creator_user_token
      WHERE
          m.creator_set_visibility = "public"
          AND m.token IN (
      "#,
    )

  } else {
    QueryBuilder::new(r#"
      SELECT
          m.token,
          m.media_type,

          m.origin_category,
          m.origin_product_category,
          m.maybe_origin_model_type,
          m.maybe_origin_model_token,

          users.token as maybe_creator_user_token,
          users.username as maybe_creator_username,
          users.display_name as maybe_creator_display_name,
          users.email_gravatar_hash as maybe_creator_email_gravatar_hash,

          m.public_bucket_directory_hash,
          m.maybe_public_bucket_prefix,
          m.maybe_public_bucket_extension,

          m.created_at,
          m.updated_at

      FROM media_files as m
      LEFT OUTER JOIN users
          ON users.token = m.maybe_creator_user_token
      WHERE
          m.creator_set_visibility = "public"
          AND m.user_deleted_at IS NULL
          AND m.mod_deleted_at IS NULL
          AND m.token IN (
      "#
    )
  };

  query_builder.push(token_predicate(media_file_tokens));

  query_builder.push(")");

  let query = query_builder.build_query_as::<RawMediaFileJoinUser>();

  let results = query.fetch_all(connection).await?;

  Ok(results)
}

/// Return a comma-separated predicate, since SQLx does not yet support WHERE IN(?) for Vec<T>, etc.
/// Issue: https://github.com/launchbadge/sqlx/issues/875
fn token_predicate(tokens: &[MediaFileToken]) -> String {
  tokens.iter()
      .map(|ty| ty.as_str())
      .map(|ty| format!("\"{}\"", ty))
      .collect::<Vec<String>>()
      .join(", ")
}

fn map_to_media_files(dataset:Vec<RawMediaFileJoinUser>) -> Vec<MediaFilesByTokensRecord> {
  let media_files: Vec<MediaFilesByTokensRecord> = dataset
      .into_iter()
      .map(|media_file: RawMediaFileJoinUser| {
        MediaFilesByTokensRecord {
          token: media_file.token,

          origin_category: media_file.origin_category,
          origin_product_category: media_file.origin_product_category,
          maybe_origin_model_type: media_file.maybe_origin_model_type,
          maybe_origin_model_token: media_file.maybe_origin_model_token,

          maybe_creator_user_token: media_file.maybe_creator_user_token,
          maybe_creator_username: media_file.maybe_creator_username,
          maybe_creator_display_name: media_file.maybe_creator_display_name,
          maybe_creator_email_gravatar_hash: media_file.maybe_creator_email_gravatar_hash,

          media_type: media_file.media_type,
          public_bucket_directory_hash: media_file.public_bucket_directory_hash,
          maybe_public_bucket_prefix: media_file.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: media_file.maybe_public_bucket_extension,

          created_at: media_file.created_at,
          updated_at: media_file.updated_at,
        }
      }).collect();

  media_files
}

  #[derive(Serialize)]
  pub struct RawMediaFileJoinUser {
    pub token: MediaFileToken,

    pub media_type: MediaFileType,

    pub origin_category: MediaFileOriginCategory,
    pub origin_product_category: MediaFileOriginProductCategory,
    pub maybe_origin_model_type: Option<MediaFileOriginModelType>,
    pub maybe_origin_model_token: Option<String>,

    pub maybe_creator_user_token: Option<UserToken>,
    pub maybe_creator_username: Option<String>,
    pub maybe_creator_display_name: Option<String>,
    pub maybe_creator_email_gravatar_hash: Option<String>,

    pub public_bucket_directory_hash: String,
    pub maybe_public_bucket_prefix: Option<String>,
    pub maybe_public_bucket_extension: Option<String>,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// NB(bt,2023-12-05): There's an issue with type hinting in the `as` clauses with QueryBuilder (or
// raw query strings) and sqlx::FromRow, regardless of whether it is derived of manually
// implemented. Perhaps this will improve in the future, but for now manually constructed queries
// cannot have type hints, eg. the following:
//
//    m.token as `token: tokens::tokens::media_files::MediaFileToken`,
//    m.origin_category as `origin_category: enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory`,
//    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
//
// This results in the automatic mapping not being able to be found by name (for macro derive), and
// in the manual case `row.try_get()` etc. won't have the correct column name (since the name is the
// full "as" clause).
impl FromRow<'_, MySqlRow> for RawMediaFileJoinUser {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      token: MediaFileToken::new(row.try_get("token")?),
      media_type: MediaFileType::try_from_mysql_row(row, "media_type")?,
      origin_category: MediaFileOriginCategory::try_from_mysql_row(row, "origin_category")?,
      origin_product_category: MediaFileOriginProductCategory::try_from_mysql_row(row, "origin_product_category")?,
      maybe_origin_model_type: MediaFileOriginModelType::try_from_mysql_row_nullable(row, "maybe_origin_model_type")?,
      maybe_origin_model_token: row.try_get("maybe_origin_model_token")?,
      maybe_creator_user_token: row.try_get::<Option<String>, _>("maybe_creator_user_token")?
          .and_then(|token| Some(UserToken::new_from_str(&token))),
      maybe_creator_username: row.try_get("maybe_creator_username")?,
      maybe_creator_display_name: row.try_get("maybe_creator_display_name")?,
      maybe_creator_email_gravatar_hash: row.try_get("maybe_creator_email_gravatar_hash")?,
      public_bucket_directory_hash: row.try_get("public_bucket_directory_hash")?,
      maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
      maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
    })
  }
}
