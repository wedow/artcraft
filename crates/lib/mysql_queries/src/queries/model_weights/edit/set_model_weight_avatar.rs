use sqlx::MySqlPool;

use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;

pub struct UpdateArgs<'a> {
  pub model_weight_token: &'a ModelWeightToken,
  pub maybe_avatar_media_file_token: Option<&'a MediaFileToken>,
  //pub update_ip_address: &'a str,
  pub mysql_pool: &'a MySqlPool
}

pub async fn set_model_weight_avatar(args: UpdateArgs<'_>) -> AnyhowResult<()>{
  let transaction = args.mysql_pool.begin().await?;

  let query_result = sqlx::query!(
        r#"
        UPDATE model_weights
        SET
            maybe_avatar_media_file_token = ?
        WHERE token = ?
        LIMIT 1
        "#,
        args.maybe_avatar_media_file_token,
        args.model_weight_token,
    ).execute(args.mysql_pool).await;

  transaction.commit().await?;

  Ok(())
}
