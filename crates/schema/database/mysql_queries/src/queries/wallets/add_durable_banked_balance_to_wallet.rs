use crate::queries::wallets::internal_select_wallet_balance_for_update::internal_select_wallet_balance_for_update;
use crate::queries::wallets::wallet_update_summary::WalletUpdateSummary;
use sqlx::MySql;
use tokens::tokens::wallets::WalletToken;

pub async fn add_durable_banked_balance_to_wallet(
  wallet_token: &WalletToken,
  amount_to_add: u64,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> anyhow::Result<WalletUpdateSummary> {

  // NB: Transaction lock (!) Be careful (!!)
  let wallet = internal_select_wallet_balance_for_update(
    wallet_token,
    transaction
  ).await?;

  let existing_balance = wallet.banked_credits;
  let new_balance = existing_balance.saturating_add(amount_to_add);
  
  // TODO: Insert ledger event.

  let result = sqlx::query!(
        r#"
    UPDATE wallets
    SET
        banked_credits = ?,
        version = version + 1
    WHERE token = ?
    LIMIT 1
        "#,
    new_balance,
    wallet_token.as_str(),
  ).execute(&mut **transaction)
      .await?;

  Ok(WalletUpdateSummary {
    token: wallet.token,
    owner_user_token: wallet.owner_user_token,
    banked_credits_now: new_balance,
    monthly_credits_now: wallet.monthly_credits,
    banked_credits_before: wallet.banked_credits,
    monthly_credits_before: wallet.monthly_credits,
  })
}