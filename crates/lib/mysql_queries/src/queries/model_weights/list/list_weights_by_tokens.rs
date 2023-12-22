use chrono::{DateTime, Utc};
use sqlx::{Acquire, FromRow, MySql, MySqlConnection, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::model_weights::{
  weights_category::WeightsCategory,
  weights_types::WeightsType,
};
use enums::traits::mysql_from_row::MySqlFromRow;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

#[derive(Serialize)]
pub struct WeightsByTokensRecord {
  pub token: ModelWeightToken,

  pub weights_type: WeightsType,
  pub weights_category: WeightsCategory,

  pub title: String,

  pub maybe_thumbnail_token: Option<String>,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_email_gravatar_hash: String,

  pub public_bucket_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub cached_user_ratings_total_count: u32,
  pub cached_user_ratings_positive_count: u32,
  pub cached_user_ratings_negative_count: u32,
  pub maybe_cached_user_ratings_ratio: Option<f32>,
  pub cached_user_ratings_last_updated_at: DateTime<Utc>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn list_weights_by_tokens(
  mysql_pool: &MySqlPool,
  weight_tokens: &[ModelWeightToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<WeightsByTokensRecord>> {

  let mut connection = mysql_pool.acquire().await?;

  let raw_weights: Vec<RawWeightJoinUser> = get_raw_weights_by_tokens(&mut connection, weight_tokens, can_see_deleted).await?;

  Ok(map_to_weights(raw_weights))
}

async fn get_raw_weights_by_tokens(
  connection: &mut MySqlConnection,
  weight_tokens: &[ModelWeightToken],
  can_see_deleted: bool
) -> AnyhowResult<Vec<RawWeightJoinUser>> {

  let connection = connection.acquire().await?;

  let mut query_builder : QueryBuilder<MySql> = if can_see_deleted {
    QueryBuilder::new(r#"
      SELECT
          mw.token,
          mw.title,
          mw.weights_type,
          mw.weights_category,
          mw.maybe_thumbnail_token,
          users.token as creator_user_token,
          users.username as creator_username,
          users.display_name as creator_display_name,
          users.email_gravatar_hash as creator_email_gravatar_hash,
          mw.public_bucket_hash,
          mw.maybe_public_bucket_prefix,
          mw.maybe_public_bucket_extension,
          mw.cached_user_ratings_negative_count,
          mw.cached_user_ratings_positive_count,
          mw.cached_user_ratings_total_count,
          mw.maybe_cached_user_ratings_ratio,
          mw.cached_user_ratings_last_updated_at,
          mw.created_at,
          mw.updated_at,
          mw.user_deleted_at,
          mw.mod_deleted_at
      FROM model_weights as mw
      JOIN users
          ON users.token = mw.creator_user_token
      WHERE
          mw.creator_set_visibility = "public"
          AND mw.token IN (
      "#,
    )

  } else {
    QueryBuilder::new(r#"
      SELECT
          mw.token,
          mw.title,
          mw.weights_type,
          mw.weights_category,
          mw.maybe_thumbnail_token,
          users.token as creator_user_token,
          users.username as creator_username,
          users.display_name as creator_display_name,
          users.email_gravatar_hash as creator_email_gravatar_hash,
          mw.public_bucket_hash,
          mw.maybe_public_bucket_prefix,
          mw.maybe_public_bucket_extension,
          mw.cached_user_ratings_negative_count,
          mw.cached_user_ratings_positive_count,
          mw.cached_user_ratings_total_count,
          mw.maybe_cached_user_ratings_ratio,
          mw.cached_user_ratings_last_updated_at,
          mw.created_at,
          mw.updated_at,
          mw.user_deleted_at,
          mw.mod_deleted_at
      FROM model_weights as mw
      JOIN users
          ON users.token = mw.creator_user_token
      WHERE
          mw.creator_set_visibility = "public"
          AND mw.user_deleted_at IS NULL
          AND mw.mod_deleted_at IS NULL
          AND mw.token IN (
      "#
    )
  };

  query_builder.push(token_predicate(weight_tokens));

  query_builder.push(")");

  let query = query_builder.build_query_as::<RawWeightJoinUser>();

  let results = query.fetch_all(connection).await?;

  Ok(results)
}

/// Return a comma-separated predicate, since SQLx does not yet support WHERE IN(?) for Vec<T>, etc.
/// Issue: https://github.com/launchbadge/sqlx/issues/875
fn token_predicate(tokens: &[ModelWeightToken]) -> String {
  tokens.iter()
      .map(|ty| ty.as_str())
      .map(|ty| format!("\"{}\"", ty))
      .collect::<Vec<String>>()
      .join(", ")
}

fn map_to_weights(dataset:Vec<RawWeightJoinUser>) -> Vec<WeightsByTokensRecord> {
  let weights: Vec<WeightsByTokensRecord> = dataset
      .into_iter()
      .map(|dataset: RawWeightJoinUser| {
        WeightsByTokensRecord {
          token: dataset.token,
          title: dataset.title,
          weights_type: dataset.weights_type,
          weights_category: dataset.weights_category,
          maybe_thumbnail_token: dataset.maybe_thumbnail_token,

          creator_user_token: dataset.creator_user_token,
          creator_username:dataset.creator_username,
          creator_display_name:dataset.creator_display_name,
          creator_email_gravatar_hash:dataset.creator_email_gravatar_hash,

          public_bucket_hash: dataset.public_bucket_hash,
          maybe_public_bucket_prefix: dataset.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: dataset.maybe_public_bucket_extension,

          cached_user_ratings_negative_count: dataset.cached_user_ratings_negative_count,
          cached_user_ratings_positive_count: dataset.cached_user_ratings_positive_count,
          cached_user_ratings_total_count: dataset.cached_user_ratings_total_count,

          maybe_cached_user_ratings_ratio: dataset.maybe_cached_user_ratings_ratio,
          cached_user_ratings_last_updated_at: dataset.cached_user_ratings_last_updated_at,

          created_at: dataset.created_at,
          updated_at: dataset.updated_at,
          user_deleted_at: dataset.user_deleted_at,
          mod_deleted_at: dataset.mod_deleted_at,
        }
      }).collect();

  weights
}

  #[derive(Serialize)]
  pub struct RawWeightJoinUser {
    pub token: ModelWeightToken,

    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    
    pub title: String,
    
    pub maybe_thumbnail_token: Option<String>,

    pub creator_user_token: UserToken,
    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_email_gravatar_hash: String,

    pub public_bucket_hash: String,
    pub maybe_public_bucket_prefix: Option<String>,
    pub maybe_public_bucket_extension: Option<String>,
    
    pub cached_user_ratings_total_count: u32,
    pub cached_user_ratings_positive_count: u32,
    pub cached_user_ratings_negative_count: u32,
    pub maybe_cached_user_ratings_ratio: Option<f32>,
    pub cached_user_ratings_last_updated_at: DateTime<Utc>,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
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
impl FromRow<'_, MySqlRow> for RawWeightJoinUser {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      token: ModelWeightToken::new(row.try_get("token")?),
      weights_type: WeightsType::try_from_mysql_row(row, "weights_type")?,
      weights_category: WeightsCategory::try_from_mysql_row(row, "weights_category")?,
      title: row.try_get("title")?,
      maybe_thumbnail_token: row.try_get("maybe_thumbnail_token")?,
      creator_user_token: UserToken::new_from_str(row.try_get("creator_user_token")?),
      creator_username: row.try_get("creator_username")?,
      creator_display_name: row.try_get("creator_display_name")?,
      creator_email_gravatar_hash: row.try_get("creator_email_gravatar_hash")?,
      public_bucket_hash: row.try_get("public_bucket_hash")?,
      maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
      maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
      cached_user_ratings_total_count: row.try_get("cached_user_ratings_total_count")?,
      cached_user_ratings_positive_count: row.try_get("cached_user_ratings_positive_count")?,
      cached_user_ratings_negative_count: row.try_get("cached_user_ratings_negative_count")?,
      maybe_cached_user_ratings_ratio: row.try_get("maybe_cached_user_ratings_ratio")?,
      cached_user_ratings_last_updated_at: row.try_get("cached_user_ratings_last_updated_at")?,
      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
      user_deleted_at: row.try_get("user_deleted_at")?,
      mod_deleted_at: row.try_get("mod_deleted_at")?,
    })
  }
}
