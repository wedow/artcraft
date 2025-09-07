use crate::errors::select_optional_record_error::SelectOptionalRecordError;
use sqlx;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub async fn find_wallet_token_for_owner_user_using_connection(
  user_token: &UserToken,
  connection: &mut PoolConnection<MySql>,
) -> Result<Option<WalletToken>, SelectOptionalRecordError> {

  // NB: We want to eventually support multiple wallets per user (eg. company use case),
  // so we do not have a unique key on user token. In the meantime, to ensure we use the
  // same wallet each time, we order by id and take the first one.
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
    Err(e) => Err(e.into()),
  }
}


pub async fn find_wallet_token_for_owner_user_using_transaction(
  user_token: &UserToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<Option<WalletToken>, SelectOptionalRecordError> {

  // NB: We want to eventually support multiple wallets per user (eg. company use case),
  // so we do not have a unique key on user token. In the meantime, to ensure we use the
  // same wallet each time, we order by id and take the first one.
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
    Err(e) => Err(e.into()),
  }
}

#[derive(sqlx::FromRow)]
struct RecordRaw {
  token: WalletToken,
}
