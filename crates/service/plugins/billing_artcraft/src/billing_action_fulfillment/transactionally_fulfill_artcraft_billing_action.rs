use crate::billing_action_fulfillment::artcraft_billing_action::ArtcraftBillingAction;
use crate::billing_action_fulfillment::credits_pack::complete_credits_pack_purchase::complete_credits_pack_purchase;
use crate::billing_action_fulfillment::subscriptions::mark_subscription_as_paid::mark_subscription_as_paid;
use crate::billing_action_fulfillment::subscriptions::upsert_subscription_details::{upsert_subscription_details, CrudType};
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{info, warn};
use sqlx::Transaction;

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
      info!("Completing credits pack purchase for user: {:?} ... ", purchase.owner_user_token);
      complete_credits_pack_purchase(
        &purchase.owner_user_token,
        &purchase.pack,
        purchase.quantity,
        transaction,
      ).await?;
    }
    ArtcraftBillingAction::SubscriptionCreated(subscription_details) => {
      info!("Upserting subscription details (sub created) for user {:?}", subscription_details.owner_user_token);
      upsert_subscription_details(subscription_details, CrudType::Create, transaction).await?;
    }
    ArtcraftBillingAction::SubscriptionUpdated(subscription_details) => {
      info!("Upserting subscription details (sub updated) for user {:?}", subscription_details.owner_user_token);
      upsert_subscription_details(subscription_details, CrudType::Update, transaction).await?;
    }
    ArtcraftBillingAction::SubscriptionDeleted(subscription_details) => {
      info!("Upserting subscription details (sub deleted) for user {:?}", subscription_details.owner_user_token);
      upsert_subscription_details(subscription_details, CrudType::Delete, transaction).await?;
    }
    ArtcraftBillingAction::SubscriptionPaid(paid_details) => {
      info!("Completing subscription paid event for user: {:?}", paid_details.owner_user_token);
      mark_subscription_as_paid(paid_details, transaction).await?;
    }
    _ => {
      return Err(anyhow!("Unhandled billing action in fulfillment"));
    }
  }

  Ok(())
}
