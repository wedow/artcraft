use anyhow::anyhow;
use sqlx::MySqlPool;

use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;

pub struct UpdateWeightArgs<'a> {
    pub weight_token: &'a ModelWeightToken,
    pub title: Option<&'a str>,
    pub maybe_thumbnail_token: Option<&'a str>,
    pub description_markdown: Option<&'a str>,
    pub description_rendered_html: Option<&'a str>,
    pub creator_set_visibility: Option<&'a Visibility>,
    pub weights_type: Option<String>,
    pub weights_category: Option<String>,
    pub mysql_pool: &'a MySqlPool,
}

pub async fn update_weights(args: UpdateWeightArgs<'_>) -> AnyhowResult<()> {
    let transaction = args.mysql_pool.begin().await?;


    let query_result = sqlx::query!(
        r#"
    UPDATE model_weights
    SET
        title = COALESCE(?, title),
        description_markdown = COALESCE(?, description_markdown),
        maybe_thumbnail_token = COALESCE(?, maybe_thumbnail_token),
        description_rendered_html = COALESCE(?, description_rendered_html),
        creator_set_visibility = COALESCE(?, creator_set_visibility),
        version = version + 1
    WHERE token = ?
    "#,
        args.title.as_deref(),
        args.description_markdown.as_deref(),
        args.maybe_thumbnail_token.as_deref(),
        args.description_rendered_html.as_deref(),
        args.creator_set_visibility.as_deref(),
        args.weight_token.as_str()
    )
    .execute(args.mysql_pool).await;

    transaction.commit().await?;

    match query_result {
        Ok(_) => Ok(()),
        Err(err) => { 
            Err(anyhow!("weights update error: {:?}", err)) 
        }
    }
}

#[cfg(test)]
mod tests {

    // Template
    use sqlx::mysql::MySqlPoolOptions;
    use tokio;

    use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
    use errors::AnyhowResult;

    #[tokio::test]
    async fn test_update_weights() -> AnyhowResult<()> {
        let db_connection_string = DEFAULT_MYSQL_CONNECTION_STRING;

        let pool = MySqlPoolOptions::new()
            .max_connections(3)
            .connect(&db_connection_string)
            .await?;

        Ok(())
    }
}