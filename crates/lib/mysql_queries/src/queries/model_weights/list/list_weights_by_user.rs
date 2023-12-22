use chrono::{DateTime, Utc};
use sqlx::{FromRow, MySql, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::model_weights::{
  weights_category::WeightsCategory,
  weights_types::WeightsType,
};
use enums::common::visibility::Visibility;
use enums::traits::mysql_from_row::MySqlFromRow;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

pub struct WeightsForUserListPage {
  pub records: Vec<WeightsJoinUserRecord>,

  pub sort_ascending: bool,

  pub current_page: usize,
  pub total_page_count: usize,
}


#[derive(Serialize)]
pub struct WeightsJoinUserRecord {
    pub token: ModelWeightToken,

    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    
    pub title: String,
    
    pub maybe_thumbnail_token: Option<String>,
    
    pub description_markdown: String,
    pub description_rendered_html: String,
    
    pub creator_user_token: UserToken,
    pub creator_ip_address: String,
    pub creator_set_visibility: Visibility,
    
    pub maybe_last_update_user_token: Option<UserToken>,
    
    pub original_download_url: Option<String>,
    pub original_filename: Option<String>,
    
    pub file_size_bytes: i32,
    pub file_checksum_sha2: String,
    
    pub public_bucket_hash: String,
    pub maybe_public_bucket_prefix: Option<String>,
    pub maybe_public_bucket_extension: Option<String>,
    
    pub cached_user_ratings_total_count: u32,
    pub cached_user_ratings_positive_count: u32,
    pub cached_user_ratings_negative_count: u32,
    pub maybe_cached_user_ratings_ratio: Option<f32>,
    pub cached_user_ratings_last_updated_at: DateTime<Utc>,
    
    pub version: i32,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
    
    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_email_gravatar_hash: String,
}

pub struct ListWeightsForUserArgs<'a> {
  pub creator_username: &'a str,
  pub page_size: usize,
  pub page_index: usize,
  pub sort_ascending: bool,
  pub can_see_deleted: bool,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_weights_by_creator_username(args: ListWeightsForUserArgs<'_>) -> AnyhowResult<WeightsForUserListPage> {
    let count_fields = select_total_count_field();
    let mut count_query_builder = query_builder(
        args.creator_username,
        false,
        0,
        0,
        args.sort_ascending,
        count_fields.as_str(),
        args.can_see_deleted,
    );

    let row_count_query = count_query_builder.build_query_scalar::<i64>();
    let row_count_result = row_count_query.fetch_one(args.mysql_pool).await?;

    /// Now fetch the actual results with all the fields
    let result_fields = select_result_fields();
    let mut query = query_builder(
        args.creator_username,
        true,
        args.page_index,
        args.page_size,
        args.sort_ascending,
        result_fields.as_str(),
        args.can_see_deleted,
    );

    let query = query.build_query_as::<RawWeightJoinUser>();
    let results = query.fetch_all(args.mysql_pool).await?;

    let number_of_pages = (row_count_result / args.page_size as i64) as usize;



    let weights_records: Vec<WeightsJoinUserRecord> = map_to_weights(results).await;


    Ok(WeightsForUserListPage {
        records: weights_records,
        sort_ascending: args.sort_ascending,
        current_page: args.page_index,
        total_page_count: number_of_pages,
    })
}

fn select_total_count_field() -> String {
    r#"
    COUNT(mw.id) AS total_count
  "#
        .to_string()
}

fn select_result_fields() -> String {
    r#"
                mw.token,
                mw.title,
                mw.weights_type,
                mw.weights_category,
                mw.maybe_thumbnail_token,
                mw.description_markdown,
                mw.description_rendered_html,
                u.token as creator_user_token,
                u.username as creator_username,
                u.display_name as creator_display_name,
                u.email_gravatar_hash as creator_email_gravatar_hash,
                mw.creator_ip_address,
                mw.creator_set_visibility,
                mw.maybe_last_update_user_token,
                mw.original_download_url,
                mw.original_filename,
                mw.file_size_bytes,
                mw.file_checksum_sha2,
                mw.public_bucket_hash,
                mw.maybe_public_bucket_prefix,
                mw.maybe_public_bucket_extension,
                mw.cached_user_ratings_negative_count,
                mw.cached_user_ratings_positive_count,
                mw.cached_user_ratings_total_count,
                mw.maybe_cached_user_ratings_ratio,
                mw.cached_user_ratings_last_updated_at,
                mw.version,
                mw.created_at,
                mw.updated_at,
                mw.user_deleted_at,
                mw.mod_deleted_at
                "#.to_string()
}

fn query_builder<'a>(
    username: &'a str,
    enforce_limits: bool,
    page_index: usize,
    page_size: usize,
    sort_ascending: bool,
    select_fields: &'a str,
    can_see_deleted: bool,
) -> QueryBuilder<'a, MySql> {

    // NB: Query cannot be statically checked by sqlx
    let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
        format!(r#"
SELECT
     {select_fields}
FROM model_weights as mw
JOIN users as u
    ON u.token = mw.creator_user_token
    "#
        ));

    if !can_see_deleted {
       query_builder.push(" WHERE mw.user_deleted_at IS NULL AND mw.mod_deleted_at IS NULL ");
    }

    query_builder.push(" AND u.username = ");
    query_builder.push_bind(username);


    if sort_ascending {
        query_builder.push(" ORDER BY mw.created_at ASC ");
    } else {
        query_builder.push(" ORDER BY mw.created_at DESC ");
    }

    if enforce_limits {
        let offset = page_index * page_size;
        query_builder.push(format!(" LIMIT {page_size} OFFSET {offset} "));
    }

    query_builder
}


async fn map_to_weights(dataset:Vec<RawWeightJoinUser>) -> Vec<WeightsJoinUserRecord> {
    let weights: Vec<WeightsJoinUserRecord> = dataset
        .into_iter()
        .map(|dataset: RawWeightJoinUser| {
            WeightsJoinUserRecord {
                token: dataset.token,
                title: dataset.title,
                weights_type: dataset.weights_type,
                weights_category: dataset.weights_category,
                maybe_thumbnail_token: dataset.maybe_thumbnail_token,
                description_markdown: dataset.description_markdown,
                description_rendered_html: dataset.description_rendered_html,

                creator_user_token: dataset.creator_user_token,
                creator_ip_address: dataset.creator_ip_address,
                creator_set_visibility: dataset.creator_set_visibility,

                maybe_last_update_user_token: dataset.maybe_last_update_user_token,
                original_download_url: dataset.original_download_url,
                original_filename: dataset.original_filename,
                file_size_bytes: dataset.file_size_bytes,
                file_checksum_sha2: dataset.file_checksum_sha2,
                public_bucket_hash: dataset.public_bucket_hash,
                maybe_public_bucket_prefix: dataset.maybe_public_bucket_prefix,
                maybe_public_bucket_extension: dataset.maybe_public_bucket_extension,

                cached_user_ratings_negative_count: dataset.cached_user_ratings_negative_count,
                cached_user_ratings_positive_count: dataset.cached_user_ratings_positive_count,
                cached_user_ratings_total_count: dataset.cached_user_ratings_total_count,

                maybe_cached_user_ratings_ratio: dataset.maybe_cached_user_ratings_ratio,
                cached_user_ratings_last_updated_at: dataset.cached_user_ratings_last_updated_at,
                version: dataset.version,
                created_at: dataset.created_at,
                updated_at: dataset.updated_at,
                user_deleted_at: dataset.user_deleted_at,
                mod_deleted_at: dataset.mod_deleted_at,

                creator_username:dataset.creator_username,
                creator_display_name:dataset.creator_display_name,
                creator_email_gravatar_hash:dataset.creator_email_gravatar_hash
            }
        }).collect();

        weights
}


  pub struct RawWeightJoinUser {
    pub token: ModelWeightToken,

    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    
    pub title: String,
    
    pub maybe_thumbnail_token: Option<String>,
    
    pub description_markdown: String,
    pub description_rendered_html: String,
    
    pub creator_user_token: UserToken,
    pub creator_ip_address: String,
    pub creator_set_visibility: Visibility,
    
    pub maybe_last_update_user_token: Option<UserToken>,
    
    pub original_download_url: Option<String>,
    pub original_filename: Option<String>,
    
    pub file_size_bytes: i32,
    pub file_checksum_sha2: String,
    
    pub public_bucket_hash: String,
    pub maybe_public_bucket_prefix: Option<String>,
    pub maybe_public_bucket_extension: Option<String>,
    
    pub cached_user_ratings_total_count: u32,
    pub cached_user_ratings_positive_count: u32,
    pub cached_user_ratings_negative_count: u32,
    pub maybe_cached_user_ratings_ratio: Option<f32>,
    pub cached_user_ratings_last_updated_at: DateTime<Utc>,
    
    pub version: i32,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
    
    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_email_gravatar_hash: String,
}

impl FromRow<'_, MySqlRow> for RawWeightJoinUser {
    fn from_row(row: &MySqlRow) -> std::result::Result<Self, sqlx::Error> {
        Ok(Self {
            token: row.try_get("token")?,
            weights_type: row.try_get("weights_type")?,
            weights_category: row.try_get("weights_category")?,
            title: row.try_get("title")?,
            maybe_thumbnail_token: row.try_get("maybe_thumbnail_token")?,
            description_markdown: row.try_get("description_markdown")?,
            description_rendered_html: row.try_get("description_rendered_html")?,
            creator_user_token: row.try_get("creator_user_token")?,
            creator_ip_address: row.try_get("creator_ip_address")?,
            creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,
            maybe_last_update_user_token: row.try_get("maybe_last_update_user_token")?,
            original_download_url: row.try_get("original_download_url")?,
            original_filename: row.try_get("original_filename")?,
            file_size_bytes: row.try_get("file_size_bytes")?,
            file_checksum_sha2: row.try_get("file_checksum_sha2")?,
            public_bucket_hash: row.try_get("public_bucket_hash")?,
            maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
            maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
            cached_user_ratings_total_count: row.try_get("cached_user_ratings_total_count")?,
            cached_user_ratings_positive_count: row.try_get("cached_user_ratings_positive_count")?,
            cached_user_ratings_negative_count: row.try_get("cached_user_ratings_negative_count")?,
            maybe_cached_user_ratings_ratio: row.try_get("maybe_cached_user_ratings_ratio")?,
            cached_user_ratings_last_updated_at: row.try_get("cached_user_ratings_last_updated_at")?,
            version: row.try_get("version")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            user_deleted_at: row.try_get("user_deleted_at")?,
            mod_deleted_at: row.try_get("mod_deleted_at")?,
            creator_username: row.try_get("creator_username")?,
            creator_display_name: row.try_get("creator_display_name")?,
            creator_email_gravatar_hash: row.try_get("creator_email_gravatar_hash")?,
        })
    }
}