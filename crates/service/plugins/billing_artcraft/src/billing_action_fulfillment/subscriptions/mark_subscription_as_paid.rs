use crate::billing_action_fulfillment::artcraft_billing_action::SubscriptionPaidEvent;

pub async fn mark_subscription_as_paid(
  details: &SubscriptionPaidEvent,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> anyhow::Result<()> {
  
  
  
  
  Ok(())
}
