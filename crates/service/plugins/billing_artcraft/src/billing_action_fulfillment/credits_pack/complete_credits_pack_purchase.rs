use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use log::info;
use mysql_queries::queries::wallets::add_durable_banked_balance_to_wallet::add_durable_banked_balance_to_wallet;
use mysql_queries::queries::wallets::create_new_wallet_for_owner_user::create_new_wallet_for_owner_user;
use mysql_queries::queries::wallets::find_wallet_token_for_owner_user::find_wallet_token_for_owner_user_using_transaction;
use tokens::tokens::users::UserToken;

/// Record the credits pack purchase
pub async fn complete_credits_pack_purchase(
  owner_user_token: &UserToken,
  pack: &StripeArtcraftCreditsPackInfo,
  quantity: u64,
  maybe_ledger_ref: Option<&str>,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> anyhow::Result<()> {

  let maybe_wallet_token = find_wallet_token_for_owner_user_using_transaction(
    owner_user_token, transaction).await?;
  
  let wallet_token = match maybe_wallet_token {
    Some(token) => token,
    None => {
      info!("No wallet found for user: {} ; creating a new one...", owner_user_token.as_str());
      create_new_wallet_for_owner_user(owner_user_token, transaction).await?
    }
  };
  
  let credits_purchased = pack.purchase_credits_amount.saturating_mul(quantity);
  
  info!("Adding {} credits to wallet: {}", credits_purchased, wallet_token.as_str());
  
  let _result = add_durable_banked_balance_to_wallet(
    &wallet_token, 
    credits_purchased, 
    maybe_ledger_ref,
    transaction,
  ).await?;

  Ok(())
}
