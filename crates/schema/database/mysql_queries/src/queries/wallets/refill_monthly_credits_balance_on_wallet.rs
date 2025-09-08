use crate::queries::wallets::internal_select_wallet_balance_for_update::internal_select_wallet_balance_for_update;
use crate::queries::wallets::wallet_update_summary::WalletUpdateSummary;
use sqlx::MySql;
use tokens::tokens::wallets::WalletToken;

pub async fn refill_monthly_credits_balance_on_wallet(
  wallet_token: &WalletToken,
  monthly_amount: u64,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> anyhow::Result<WalletUpdateSummary> {

  // NB: Transaction lock (!) Be careful (!!)
  let wallet = internal_select_wallet_balance_for_update(
    wallet_token,
    transaction
  ).await?;

  let existing_balance = wallet.monthly_credits;
  let new_balance = monthly_amount;

  // TODO: Insert ledger event.

  let result = sqlx::query!(
        r#"
    UPDATE wallets
    SET
        monthly_credits = ?,
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

    // We updated monthly credits
    monthly_credits_now: new_balance,
    monthly_credits_before: wallet.monthly_credits,

    // Banked credits not touched
    banked_credits_now: wallet.banked_credits,
    banked_credits_before: wallet.banked_credits,
  })
}
