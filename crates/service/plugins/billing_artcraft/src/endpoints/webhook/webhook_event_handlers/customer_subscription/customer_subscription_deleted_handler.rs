use crate::configs::get_artcraft_product_by_stripe_id_and_env::get_artcraft_product_by_stripe_id_and_env;
use crate::endpoints::webhook::webhook_event_handlers::customer_subscription::calculate_subscription_end_date::calculate_subscription_end_date;
use crate::endpoints::webhook::webhook_event_handlers::customer_subscription::subscription_event_extractor::subscription_summary_extractor;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_summary::StripeArtcraftWebhookSummary;
use enums::common::subscription_namespace::SubscriptionNamespace;
use log::error;
use mysql_queries::queries::users::user_subscriptions::get_user_subscription_by_stripe_subscription_id::{get_user_subscription_by_stripe_subscription_id, get_user_subscription_by_stripe_subscription_id_with_connection};
use mysql_queries::queries::users::user_subscriptions::upsert_user_subscription_by_stripe_id::UpsertUserSubscription;
use reusable_types::server_environment::ServerEnvironment;
use reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;
use stripe_shared::Subscription;

/// Handle event type: 'customer.subscription.deleted'
/// Sent when a customer’s subscription ends.
pub async fn customer_subscription_deleted_handler(
  subscription: &Subscription,
  server_environment: ServerEnvironment,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<StripeArtcraftWebhookSummary, StripeArtcraftWebhookError> {
  let summary = subscription_summary_extractor(subscription)
      .map_err(|err| {
        let reason = format!("Error extracting subscription from 'customer.subscription.deleted' payload: {:?}", err);
        error!("{}", reason);
        StripeArtcraftWebhookError::ServerError(reason) // NB: This was probably *our* fault.
      })?;

  let mut should_process_update = true;

  let mut result = StripeArtcraftWebhookSummary {
    maybe_user_token: summary.user_token.clone(),
    maybe_event_entity_id: Some(summary.stripe_subscription_id.clone()),
    maybe_stripe_customer_id: Some(summary.stripe_customer_id.clone()),
    action_was_taken: false,
    should_ignore_retry: false,
  };

  let maybe_product = get_artcraft_product_by_stripe_id_and_env(
    &summary.stripe_product_id, server_environment);

  let product = match maybe_product {
    None => {
      error!("No matching product for stripe product ID: {}", &summary.stripe_product_id);
      result.should_ignore_retry = true;
      return Ok(result);
    }
    Some(product) => product,
  };

  // NB: It's possible to receive events out of order.
  let maybe_existing_subscription = get_user_subscription_by_stripe_subscription_id_with_connection(
    &summary.stripe_subscription_id, mysql_connection)
      .await
      .map_err(|err| {
        let reason = format!("Mysql error: {:?}", err);
        error!("{}", reason);
        StripeArtcraftWebhookError::ServerError(reason)
      })?;

  if let Some(existing_subscription) = maybe_existing_subscription {
    match existing_subscription.maybe_stripe_subscription_status {
      Some(StripeSubscriptionStatus::Canceled) => {
        // NB: The stored subscription already had a terminal status and the subscription cannot be updated any further.
        should_process_update = false;
        result.should_ignore_retry = true;
      }
      _ => {}
    }
  }

  // NB: Even if we haven't received a record before, we should still be able to "tombstone" it
  // once we detect the deletion.
  if should_process_update {
    if let Some(user_token) = summary.user_token.as_deref() {

      let upsert = UpsertUserSubscription {
        stripe_subscription_id: &summary.stripe_subscription_id,
        user_token,
        subscription_namespace: SubscriptionNamespace::Artcraft,
        subscription_product_slug: &product.slug.to_str(),
        maybe_stripe_customer_id: Some(&summary.stripe_customer_id),
        maybe_stripe_product_id: Some(&summary.stripe_product_id),
        maybe_stripe_price_id: Some(&summary.stripe_price_id),
        maybe_stripe_recurring_interval: Some(summary.subscription_interval),
        maybe_stripe_subscription_status: Some(summary.stripe_subscription_status),
        maybe_stripe_is_production: Some(summary.stripe_is_production),
        subscription_start_at: summary.subscription_start_date,
        current_billing_period_start_at: summary.current_billing_period_start,
        current_billing_period_end_at: summary.current_billing_period_end,
        subscription_expires_at: calculate_subscription_end_date(&summary),
        maybe_cancel_at: summary.maybe_cancel_at,
        maybe_canceled_at: summary.maybe_canceled_at,
      };

      let _r = upsert.upsert_with_connection(mysql_connection)
          .await
          .map_err(|err| {
            let reason = format!("Mysql error: {:?}", err);
            error!("{}", reason);
            StripeArtcraftWebhookError::ServerError(reason)
          })?;

      result.action_was_taken = true;
    }

    result.should_ignore_retry = true;
  }

  Ok(result)
}
