use errors::AnyhowResult;
use sqlx::MySql;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub async fn create_new_wallet_for_owner_user(
  user_token: &UserToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> AnyhowResult<WalletToken> {
  let token = WalletToken::generate();

  let result = sqlx::query!(
        r#"
INSERT INTO wallets
SET
  token = ?,

  owner_user_token = ?,
  
  banked_credits = 0,
  monthly_credits = 0,

  subscription_is_active = false,
  subscription_is_paid = false
        "#,
        token.as_str(),
        user_token.as_str()
    )
      .execute(&mut **transaction)
      .await;
  
  match result {
    Ok(_) => Ok(token),
    Err(e) => Err(anyhow::anyhow!("Database query error when creating wallet: {}", e)),
  }
}
