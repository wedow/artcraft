use crate::http_server::common_responses::common_web_error::CommonWebError;
use anyhow::anyhow;
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use log::{error, info, warn};
use mysql_queries::queries::wallets::create_new_artcraft_wallet_for_owner_user::create_new_artcraft_wallet_for_owner_user;
use mysql_queries::queries::wallets::find_primary_wallet_token_for_owner::{find_primary_wallet_token_for_owner_using_connection, find_primary_wallet_token_for_owner_using_transaction};
use mysql_queries::queries::wallets::spend::try_to_spend_wallet_balance::try_to_spend_wallet_balance;
use mysql_queries::queries::wallets::spend::wallet_spend_error::WalletSpendError;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

// TODO: This hasn't really been tested yet...

pub async fn attempt_wallet_deduction_else_common_web_error(
  user_token: &UserToken,
  maybe_reference_token: Option<&str>,
  amount_to_deduct: u64,
  connection: &mut PoolConnection<MySql>
) -> Result<(), CommonWebError> {

  let result = try_wallet_deduction(
    user_token,
    maybe_reference_token,
    amount_to_deduct,
    connection
  ).await;

  // Infallible for now.
  if let Err(err) = result {
    return match err {
      WalletSpendError::InvalidAmountToSpend => {
        log::error!("invalid spend amount charged");
        Err(CommonWebError::PaymentRequired)
      }
      WalletSpendError::InsufficientBalance { requested_to_spend_amount, available_amount } => {
        log::error!("payment is required - requested: {}, available: {}", requested_to_spend_amount, available_amount);
        Err(CommonWebError::PaymentRequired)
      }
      WalletSpendError::SelectError(err) => {
        log::error!("SQL error (select) in attempt_wallet_deduction: {:?}", err);
        Err(CommonWebError::ServerError)
      }
      WalletSpendError::SelectOptionalError(err) => {
        log::error!("SQL error (select optional) in attempt_wallet_deduction: {:?}", err);
        Err(CommonWebError::ServerError)
      }
      WalletSpendError::SqlxError(err) => {
        log::error!("SQL error (sqlx) in attempt_wallet_deduction: {:?}", err);
        Err(CommonWebError::ServerError)
      }
    }
  }

  Ok(())
}

async fn try_wallet_deduction(
  owner_user_token: &UserToken,
  maybe_reference_token: Option<&str>,
  amount_to_deduct: u64,
  connection: &mut PoolConnection<MySql>
) -> Result<(), WalletSpendError>
{
  let maybe_wallet_token = find_primary_wallet_token_for_owner_using_connection(
    owner_user_token,
    PaymentsNamespace::Artcraft,
    connection
  ).await?;

  let mut transaction = connection.begin().await?;

  let result = try_wallet_deduction_with_transaction(
    owner_user_token,
    maybe_wallet_token,
    maybe_reference_token,
    amount_to_deduct,
    &mut transaction
  ).await;

  match result {
    Ok(()) => {
      transaction.commit().await?;
    },
    Err(err) => {
      error!("Error handling temporary wallet deduction for user {:?} : {:?}",
        owner_user_token, err);

      transaction.rollback().await?;

      return Err(err);
    }
  }

  Ok(())
}

async fn try_wallet_deduction_with_transaction(
  owner_user_token: &UserToken,
  maybe_wallet_token: Option<WalletToken>,
  maybe_reference_token: Option<&str>,
  amount_to_deduct: u64,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<(), WalletSpendError>
{
  let wallet_token = match maybe_wallet_token {
    Some(token) => token,
    None => {
      info!("No wallet found for user: {} ; creating a new one...", owner_user_token.as_str());
      create_new_artcraft_wallet_for_owner_user(owner_user_token, transaction).await?
    }
  };

  let result = try_to_spend_wallet_balance(
    &wallet_token, 
    amount_to_deduct, 
    maybe_reference_token, 
    transaction
  ).await;
  
  if let Err(err) = result {
    error!("Failed to deduct {} credits from wallet {} for user {} : {:?}",
      amount_to_deduct,
      wallet_token.as_str(),
      owner_user_token.as_str(),
      err);
    
    return Err(err);
  }

  Ok(())
}
