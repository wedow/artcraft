use crate::billing_action_fulfillment::artcraft_billing_action::UpsertableSubscriptionDetails;
use enums::common::subscription_namespace::SubscriptionNamespace;
use mysql_queries::queries::users::user_subscriptions::upsert_user_subscription_by_stripe_id::UpsertUserSubscription;

/// Record the credits pack purchase
pub async fn upsert_subscription_details(
  details: &UpsertableSubscriptionDetails,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> anyhow::Result<()> {


  let upsert = UpsertUserSubscription {
    // This is the primary key
    stripe_subscription_id: &details.stripe_subscription_id,

    // Artcraft product foreign keys
    user_token: details.owner_user_token.as_str(),
    subscription_namespace: SubscriptionNamespace::Artcraft,
    subscription_product_slug: details.subscription.slug.to_str(),

    // Stripe object foreign keys
    maybe_stripe_customer_id: Some(&details.stripe_customer_id),
    maybe_stripe_product_id: Some(&details.stripe_product_id),
    maybe_stripe_price_id: Some(&details.stripe_price_id),

    // Core subscription metadata
    maybe_stripe_recurring_interval: Some(details.stripe_recurring_interval),
    maybe_stripe_subscription_status: Some(details.stripe_subscription_status),
    maybe_stripe_is_production: Some(details.stripe_is_production),

    // Timing data
    subscription_start_at: details.subscription_start_at,
    current_billing_period_start_at: details.current_billing_period_start_at,
    current_billing_period_end_at: details.current_billing_period_end_at,
    subscription_expires_at: details.calculated_subscription_expires_at,
    maybe_cancel_at: details.maybe_cancel_at,
    maybe_canceled_at: details.maybe_canceled_at,
  };

  upsert.upsert_with_transaction(transaction).await?;

  Ok(())
}
