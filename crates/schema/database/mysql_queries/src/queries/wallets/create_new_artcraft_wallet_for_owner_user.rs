use crate::queries::wallet_ledger_entries::internal_insert_wallet_created_ledger_entry::internal_insert_wallet_created_ledger_entry;
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use log::error;
use sqlx::MySql;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

const ARTCRAFT_NAMESPACE: &str = PaymentsNamespace::Artcraft.to_str();

pub async fn create_new_artcraft_wallet_for_owner_user(
  user_token: &UserToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<WalletToken, sqlx::Error> {
  let token = WalletToken::generate();

  let result = sqlx::query!(
        r#"
INSERT INTO wallets
SET
  token = ?,
  wallet_namespace = ?,

  owner_user_token = ?,
  
  banked_credits = 0,
  monthly_credits = 0
        "#,
        token.as_str(),
        ARTCRAFT_NAMESPACE,
        user_token.as_str()
    )
      .execute(&mut **transaction)
      .await;
  
  if let Err(err) = result {
    error!("Error while inserting wallet: {}", err);
    return Err(err);
  }
  
  internal_insert_wallet_created_ledger_entry(&token, transaction).await?;
  
  Ok(token)
}
