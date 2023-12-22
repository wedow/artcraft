use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use container_common::anyhow_result::AnyhowResult;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use tokens::tokens::{model_weights::ModelWeightToken, users::UserToken};

// Notes ensure that Enums have sqlx::Type
//  'weights_type: enums::by_table::model_weights::weights_types::WeightsType' use this to map
// Retrieved Model Weight can be constrained to the fields that are needed

pub struct RetrivedModelWeight {
    pub token: ModelWeightToken,
    pub title: String,
    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    pub maybe_thumbnail_token: Option<String>,
    pub description_markdown: String,
    pub description_rendered_html: String,

    pub creator_user_token: UserToken,
    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_gravatar_hash: String,

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

    pub maybe_avatar_public_bucket_hash: Option<String>,
    pub maybe_avatar_public_bucket_prefix: Option<String>,
    pub maybe_avatar_public_bucket_extension: Option<String>,

    pub cached_user_ratings_negative_count: u32,
    pub cached_user_ratings_positive_count: u32,
    pub cached_user_ratings_total_count: u32,
    pub maybe_cached_user_ratings_ratio: Option<f32>,
    pub cached_user_ratings_last_updated_at: DateTime<Utc>,
    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_weight_by_token(
    weight_token: &ModelWeightToken,
    can_see_deleted: bool,
    mysql_pool: &MySqlPool
) -> AnyhowResult<Option<RetrivedModelWeight>> {
    let mut connection = mysql_pool.acquire().await?;
    get_weights_by_token_with_connection(weight_token, can_see_deleted, &mut connection).await
}

pub async fn get_weights_by_token_with_connection(
    weight_token: &ModelWeightToken,
    can_see_deleted: bool,
    mysql_connection: &mut PoolConnection<MySql>
) -> AnyhowResult<Option<RetrivedModelWeight>> {
    let maybe_result = if can_see_deleted {
        select_include_deleted(weight_token, mysql_connection).await
    } else {
        select_without_deleted(weight_token, mysql_connection).await
    };

    let record: RawWeight = match maybe_result {
        Ok(record) => record,
        Err(sqlx::Error::RowNotFound) => {
            return Ok(None);
        }
        Err(err) => {
            error!("Error fetching weights by token: {:?}", err);
            return Err(anyhow!("Error fetching weights by token: {:?}", err));
        }
    };

    // unwrap the result

    Ok(
        Some(RetrivedModelWeight {
            token: record.token,
            title: record.title,
            weights_type: record.weights_type,
            weights_category: record.weights_category,
            maybe_thumbnail_token: record.maybe_thumbnail_token,
            description_markdown: record.description_markdown,
            description_rendered_html: record.description_rendered_html,
            creator_user_token: record.creator_user_token,
            creator_username: record.creator_username,
            creator_display_name: record.creator_display_name,
            creator_gravatar_hash: record.creator_gravatar_hash,
            creator_ip_address: record.creator_ip_address,
            creator_set_visibility: record.creator_set_visibility,
            maybe_last_update_user_token: record.maybe_last_update_user_token,
            original_download_url: record.original_download_url,
            original_filename: record.original_filename,
            file_size_bytes: record.file_size_bytes,
            file_checksum_sha2: record.file_checksum_sha2,
            public_bucket_hash: record.public_bucket_hash,
            maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
            maybe_public_bucket_extension: record.maybe_public_bucket_extension,
            maybe_avatar_public_bucket_hash: record.maybe_avatar_public_bucket_hash,
            maybe_avatar_public_bucket_prefix: record.maybe_avatar_public_bucket_prefix,
            maybe_avatar_public_bucket_extension: record.maybe_avatar_public_bucket_extension,
            cached_user_ratings_negative_count: record.cached_user_ratings_negative_count,
            cached_user_ratings_positive_count: record.cached_user_ratings_positive_count,
            cached_user_ratings_total_count: record.cached_user_ratings_total_count,
            maybe_cached_user_ratings_ratio: record.maybe_cached_user_ratings_ratio,
            cached_user_ratings_last_updated_at: record.cached_user_ratings_last_updated_at,
            version: record.version,
            created_at: record.created_at,
            updated_at: record.updated_at,
            user_deleted_at: record.user_deleted_at,
            mod_deleted_at: record.mod_deleted_at,
        })
    )
}

async fn select_include_deleted(
    weight_token: &ModelWeightToken,
    mysql_connection: &mut PoolConnection<MySql>
) -> Result<RawWeight, sqlx::Error> {
    sqlx
        ::query_as!(
            RawWeight,
            r#"
        SELECT
        wt.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
        wt.title,
        wt.weights_type as `weights_type: enums::by_table::model_weights::weights_types::WeightsType`,
        wt.weights_category as `weights_category: enums::by_table::model_weights::weights_category::WeightsCategory`,
        wt.maybe_thumbnail_token,
        wt.description_markdown,
        wt.description_rendered_html,

        wt.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
        users.username as creator_username,
        users.display_name as creator_display_name,
        users.email_gravatar_hash AS creator_gravatar_hash,

        wt.creator_ip_address,
        wt.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
        wt.maybe_last_update_user_token as `maybe_last_update_user_token: tokens::tokens::users::UserToken`,
        wt.original_download_url,
        wt.original_filename,
        wt.file_size_bytes,
        wt.file_checksum_sha2,
        wt.public_bucket_hash,
        wt.maybe_public_bucket_prefix,
        wt.maybe_public_bucket_extension,

        avatar.public_bucket_directory_hash as maybe_avatar_public_bucket_hash,
        avatar.maybe_public_bucket_prefix as maybe_avatar_public_bucket_prefix,
        avatar.maybe_public_bucket_extension as maybe_avatar_public_bucket_extension,

        wt.cached_user_ratings_negative_count,
        wt.cached_user_ratings_positive_count,
        wt.cached_user_ratings_total_count,
        wt.maybe_cached_user_ratings_ratio,
        wt.cached_user_ratings_last_updated_at,
        wt.version,
        wt.created_at,
        wt.updated_at,
        wt.user_deleted_at,
        wt.mod_deleted_at
        FROM model_weights as wt
        JOIN users
            ON users.token = wt.creator_user_token
        LEFT OUTER JOIN media_files as avatar
            ON avatar.token = wt.maybe_avatar_media_file_token
        WHERE
            wt.token = ?
            "#,
            weight_token.as_str()
        )
        .fetch_one(&mut **mysql_connection).await
}

async fn select_without_deleted(
    weight_token: &ModelWeightToken,
    mysql_connection: &mut PoolConnection<MySql>
) -> Result<RawWeight, sqlx::Error> {
    //as `weights_type: enums::by_table::model_weights::weights_types::WeightsType`,
    //as `weights_category: enums::by_table::model_weights::weights_category::WeightsCategory`
    sqlx
        ::query_as!(
            RawWeight,
            r#"
        SELECT
        wt.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
        wt.title,
        wt.weights_type as `weights_type: enums::by_table::model_weights::weights_types::WeightsType`,
        wt.weights_category as `weights_category: enums::by_table::model_weights::weights_category::WeightsCategory`,
        wt.maybe_thumbnail_token,
        wt.description_markdown,
        wt.description_rendered_html,
        wt.creator_ip_address,
        wt.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

        wt.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
        users.username as creator_username,
        users.display_name as creator_display_name,
        users.email_gravatar_hash AS creator_gravatar_hash,

        wt.maybe_last_update_user_token as `maybe_last_update_user_token: tokens::tokens::users::UserToken`,
        wt.original_download_url,
        wt.original_filename,
        wt.file_size_bytes,
        wt.file_checksum_sha2,
        wt.public_bucket_hash,
        wt.maybe_public_bucket_prefix,
        wt.maybe_public_bucket_extension,

        avatar.public_bucket_directory_hash as maybe_avatar_public_bucket_hash,
        avatar.maybe_public_bucket_prefix as maybe_avatar_public_bucket_prefix,
        avatar.maybe_public_bucket_extension as maybe_avatar_public_bucket_extension,

        wt.cached_user_ratings_negative_count,
        wt.cached_user_ratings_positive_count,
        wt.cached_user_ratings_total_count,
        wt.maybe_cached_user_ratings_ratio,
        wt.cached_user_ratings_last_updated_at,
        wt.version,
        wt.created_at,
        wt.updated_at,
        wt.user_deleted_at,
        wt.mod_deleted_at
        FROM model_weights as wt
        JOIN users
            ON users.token = wt.creator_user_token
        LEFT OUTER JOIN media_files as avatar
            ON avatar.token = wt.maybe_avatar_media_file_token
        WHERE
            wt.token = ?
            AND wt.user_deleted_at IS NULL
            AND wt.mod_deleted_at IS NULL
        "#,
            weight_token.as_str()
        )
        .fetch_one(&mut **mysql_connection).await
}

// RawWeight is the struct that is returned from the database in raw form.
#[derive(Serialize)]
pub struct RawWeight {
    pub token: ModelWeightToken,
    pub title: String,
    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    pub maybe_thumbnail_token: Option<String>,
    pub description_markdown: String,
    pub description_rendered_html: String,

    pub creator_user_token: UserToken,
    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_gravatar_hash: String,

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

    pub maybe_avatar_public_bucket_hash: Option<String>,
    pub maybe_avatar_public_bucket_prefix: Option<String>,
    pub maybe_avatar_public_bucket_extension: Option<String>,

    pub cached_user_ratings_negative_count: u32,
    pub cached_user_ratings_positive_count: u32,
    pub cached_user_ratings_total_count: u32,
    pub maybe_cached_user_ratings_ratio: Option<f32>,
    pub cached_user_ratings_last_updated_at: DateTime<Utc>,
    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
}
