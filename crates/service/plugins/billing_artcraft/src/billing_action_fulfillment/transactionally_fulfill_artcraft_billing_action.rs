use crate::billing_action_fulfillment::artcraft_billing_action::ArtcraftBillingAction;
use crate::billing_action_fulfillment::credits_pack::complete_credits_pack_purchase::complete_credits_pack_purchase;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{info, warn};
use sqlx::Transaction;
use crate::billing_action_fulfillment::subscriptions::upsert_subscription_details::upsert_subscription_details;

pub async fn transactionally_fulfill_artcraft_billing_action(
  event: &ArtcraftBillingAction,
  transaction: &mut Transaction<'_, sqlx::MySql>,
) -> AnyhowResult<()> {

  match event {
    ArtcraftBillingAction::IgnorableEvent => {
      warn!("Received ignorable billing action; nothing to fulfill.");
      return Ok(())
    }
    ArtcraftBillingAction::WalletCreditsPurchase(purchase) => {
      info!("Completing credits pack purchase for user: {} ... ", purchase.owner_user_token.as_str());
      complete_credits_pack_purchase(
        &purchase.owner_user_token,
        &purchase.pack,
        purchase.quantity,
        transaction,
      ).await?;
    }
    ArtcraftBillingAction::SubscriptionCreated(subscription_details) => {
      upsert_subscription_details(subscription_details, transaction).await?;
      
    }
    _ => {
      return Err(anyhow!("Unhandled billing action in fulfillment"));
    }
  }

  Ok(())
}
