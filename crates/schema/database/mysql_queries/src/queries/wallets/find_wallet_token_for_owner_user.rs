use sqlx;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub async fn find_wallet_token_for_owner_user_using_connection(
  user_token: &UserToken,
  connection: &mut PoolConnection<MySql>,
) -> anyhow::Result<Option<WalletToken>> {

  // NB: We want to eventually support multiple wallets per user (eg. company use case),
  // so we do not have a unique key on user token. In the meantime, to ensure we use the
  // same wallet each time, we order by id and take the first one.
  // TODO(bt,2025-08-07): DO NOT COPY THIS. For some reason the query macro can't
  //  decide which impl to use to deserialize typed tokens.
  let result = sqlx::query_as!(
    RecordRaw,
    r#"
      SELECT
        token as `token: tokens::tokens::wallets::WalletToken`
      FROM wallets
      WHERE owner_user_token = ?
      ORDER BY id ASC
      LIMIT 1
    "#,
    user_token.as_str()
  )
      .fetch_optional(&mut **connection)
      .await;

  match result {
    Ok(Some(record)) => Ok(Some(record.token)),
    Ok(None) => Ok(None),
    Err(e) => Err(anyhow::anyhow!("Database query error: {}", e)),
  }
}


pub async fn find_wallet_token_for_owner_user_using_transaction(
  user_token: &UserToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> anyhow::Result<Option<WalletToken>> {

  // NB: We want to eventually support multiple wallets per user (eg. company use case),
  // so we do not have a unique key on user token. In the meantime, to ensure we use the
  // same wallet each time, we order by id and take the first one.
  // TODO(bt,2025-08-07): DO NOT COPY THIS. For some reason the query macro can't
  //  decide which impl to use to deserialize typed tokens.
  let result = sqlx::query_as!(
    RecordRaw,
    r#"
      SELECT
        token as `token: tokens::tokens::wallets::WalletToken`
      FROM wallets
      WHERE owner_user_token = ?
      ORDER BY id ASC
      LIMIT 1
    "#,
    user_token.as_str()
  )
      .fetch_optional(&mut **transaction)
      .await;

  match result {
    Ok(Some(record)) => Ok(Some(record.token)),
    Ok(None) => Ok(None),
    Err(e) => Err(anyhow::anyhow!("Database query error: {}", e)),
  }
}

#[derive(sqlx::FromRow)]
struct RecordRaw {
  token: WalletToken,
}
