use container_common::anyhow_result::AnyhowResult;
use sqlx::MySqlPool;
use enums::by_table::model_weights::{
    weights_types::WeightsType,
    weights_category::WeightsCategory,
};
use log::warn;
use enums::common::visibility::Visibility;
use tokens::tokens::{ users::UserToken, model_weights::ModelWeightToken };

pub struct CreateModelWeightsArgs<'a> {
    pub token: &'a ModelWeightToken,
    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    pub title: String,
    pub maybe_thumbnail_token: Option<String>,
    pub description_markdown: String,
    pub description_rendered_html: String,
    pub creator_user_token: Option<&'a UserToken>,
    pub creator_ip_address: &'a str,
    pub creator_set_visibility: Visibility,
    pub maybe_last_update_user_token: Option<String>,
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
    pub version: i32,
    pub mysql_pool: &'a MySqlPool,
}

pub async fn create_weight(args: CreateModelWeightsArgs<'_>) -> AnyhowResult<ModelWeightToken> {
    let model_weights_token = ModelWeightToken::generate();
    let transaction = args.mysql_pool.begin().await?;
    let query_result = sqlx
        ::query!(
            r#"
        INSERT INTO model_weights
        SET
          token = ?,
          weights_type = ?,
          weights_category = ?,
          title = ?,
          maybe_thumbnail_token = ?,
          description_markdown = ?,
          description_rendered_html = ?,
          creator_user_token = ?,
          creator_ip_address = ?,
          creator_set_visibility = ?,
          maybe_last_update_user_token = ?,
          original_download_url = ?,
          original_filename = ?,
          file_size_bytes = ?,
          file_checksum_sha2 = ?,
          public_bucket_hash = ?,
          maybe_public_bucket_prefix = ?,
          maybe_public_bucket_extension = ?,
          cached_user_ratings_total_count = ?,
          cached_user_ratings_positive_count = ?,
          cached_user_ratings_negative_count = ?,
          maybe_cached_user_ratings_ratio = ?,
          version = ?
        "#,
            args.token.as_str(),
            args.weights_type.to_str(),
            args.weights_category.to_str(),
            args.title,
            args.maybe_thumbnail_token,
            args.description_markdown,
            args.description_rendered_html,
            args.creator_user_token.as_deref(),
            args.creator_ip_address,
            args.creator_set_visibility.to_str(),
            args.maybe_last_update_user_token,
            args.original_download_url,
            args.original_filename,
            args.file_size_bytes,
            args.file_checksum_sha2,
            args.public_bucket_hash,
            args.maybe_public_bucket_prefix,
            args.maybe_public_bucket_extension,
            args.cached_user_ratings_total_count,
            args.cached_user_ratings_positive_count,
            args.cached_user_ratings_negative_count,
            args.maybe_cached_user_ratings_ratio,
            args.version
        )
        .execute(args.mysql_pool).await;

    match query_result {
        Ok(_) => { Ok(model_weights_token) }
        Err(err) => {
            transaction.rollback().await?;
            warn!("Transaction failure: {:?}", err);
            Err(err.into())
        }
    }
}
