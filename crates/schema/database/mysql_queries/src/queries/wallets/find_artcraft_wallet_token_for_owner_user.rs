use crate::errors::select_optional_record_error::SelectOptionalRecordError;
use sqlx;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use sqlx::mysql::MySqlRow;
use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;
use crate::types::query_map::QueryMap;

pub async fn find_artcraft_wallet_token_for_owner_user_using_connection(
  user_token: &UserToken,
  connection: &mut PoolConnection<MySql>,
) -> Result<Option<WalletToken>, SelectOptionalRecordError> {
  let result = query(user_token)
      .fetch_optional(&mut **connection)
      .await;

  match result {
    Ok(Some(record)) => Ok(Some(record.token)),
    Ok(None) => Ok(None),
    Err(e) => Err(e.into()),
  }
}


pub async fn find_artcraft_wallet_token_for_owner_user_using_transaction(
  user_token: &UserToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<Option<WalletToken>, SelectOptionalRecordError> {
  let result = query(user_token)
      .fetch_optional(&mut **transaction)
      .await;

  match result {
    Ok(Some(record)) => Ok(Some(record.token)),
    Ok(None) => Ok(None),
    Err(e) => Err(e.into()),
  }
}

fn query(user_token: &UserToken)
  -> QueryMap<impl Send + FnMut(MySqlRow) -> Result<RecordRaw, sqlx::Error>>
{
  const ARTCRAFT_NAMESPACE: &str = PaymentsNamespace::Artcraft.to_str();
  
  // NB: We want to eventually support multiple wallets per user (eg. company use case),
  // so we do not have a unique key on user token. We do, however, have a temporary(?) unique
  // key on the combination of (owner_user_token + wallet_namespace) that we could potentially
  // lift later. 
  // In the meantime, to ensure we use the same wallet each time, we order by id and take the 
  // first one.
  sqlx::query_as!(
    RecordRaw,
    r#"
      SELECT
        token as `token: tokens::tokens::wallets::WalletToken`
      FROM wallets
      WHERE owner_user_token = ?
      AND wallet_namespace = ?
      ORDER BY id ASC
      LIMIT 1
    "#,
    user_token.as_str(),
    ARTCRAFT_NAMESPACE,
  )
}


#[derive(sqlx::FromRow)]
struct RecordRaw {
  token: WalletToken,
}
