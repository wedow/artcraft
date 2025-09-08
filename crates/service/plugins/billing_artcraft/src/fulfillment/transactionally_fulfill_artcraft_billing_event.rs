use crate::endpoints::webhook::common::billing_action::BillingAction;
use crate::fulfillment::credits_pack::complete_credits_pack_purchase::complete_credits_pack_purchase;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{info, warn};
use sqlx::Transaction;

pub async fn transactionally_fulfill_artcraft_billing_action(
  event: &BillingAction,
  transaction: &mut Transaction<'_, sqlx::MySql>,
) -> AnyhowResult<()> {

  match event {
    BillingAction::IgnorableEvent { .. } => {
      warn!("Received ignorable billing action; nothing to fulfill.");
      return Ok(())
    }
    BillingAction::WalletCreditsPurchase(purchase) => {
      info!("Completing credits pack purchase for user: {} ... ", purchase.owner_user_token.as_str());
      complete_credits_pack_purchase(
        &purchase.owner_user_token,
        &purchase.pack,
        purchase.quantity,
        transaction,
      ).await?;
    }
    _ => {
      return Err(anyhow!("Unhandled billing action in fulfillment"));
    }
  }

  Ok(())
}
