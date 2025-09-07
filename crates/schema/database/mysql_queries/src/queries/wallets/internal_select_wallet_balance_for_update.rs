use crate::errors::select_exactly_one_error::SelectExactlyOneError;
use crate::helpers::boolean_converters::i8_to_bool;
use sqlx;
use sqlx::MySql;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub (super) struct WalletForUpdate {
  pub token: WalletToken,
  pub owner_user_token: UserToken,
  
  pub banked_credits: u64,
  pub monthly_credits: u64,
  
  pub subscription_is_active: bool,
  pub subscription_is_paid: bool,
}

// NB: BE VERY CAREFUL WITH THIS FUNCTION! 
// It locks the selected wallet row for the duration of the transaction!
pub (super) async fn internal_select_wallet_balance_for_update(
  wallet_token: &WalletToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<WalletForUpdate, SelectExactlyOneError> {

  let record = sqlx::query_as!(
    RawWalletForUpdate,
        r#"
SELECT
  token as `token: tokens::tokens::wallets::WalletToken`,
  owner_user_token as `owner_user_token: tokens::tokens::users::UserToken`,
  banked_credits,
  monthly_credits,
  subscription_is_active,
  subscription_is_paid
FROM wallets
WHERE token = ?
LIMIT 1
FOR UPDATE
        "#,
        wallet_token.as_str(),
    )
      .fetch_one(&mut **transaction)
      .await?;
  
  Ok(WalletForUpdate {
    token: record.token,
    owner_user_token: record.owner_user_token,
    
    banked_credits: record.banked_credits,
    monthly_credits: record.monthly_credits,
    
    subscription_is_active: i8_to_bool(record.subscription_is_paid),
    subscription_is_paid: i8_to_bool(record.subscription_is_paid),
  })
}

struct RawWalletForUpdate {
  token: WalletToken,
  owner_user_token: UserToken,

  banked_credits: u64,
  monthly_credits: u64,

  subscription_is_active: i8,
  subscription_is_paid: i8,
}
