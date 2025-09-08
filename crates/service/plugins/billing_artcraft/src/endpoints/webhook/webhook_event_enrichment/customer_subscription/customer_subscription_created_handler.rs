use crate::configs::get_artcraft_product_by_stripe_id_and_env::get_artcraft_product_by_stripe_id_and_env;
use crate::configs::stripe_artcraft_generic_product_info::StripeArtcraftGenericProductInfo;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::common::webhook_event_log_summary::WebhookEventLogSummary;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::calculate_subscription_end_date::calculate_subscription_end_date;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::subscription_event_extractor::subscription_summary_extractor;
use enums::common::subscription_namespace::SubscriptionNamespace;
use log::error;
use mysql_queries::queries::users::user::update::update_user_record_with_new_stripe_customer_id::{update_user_record_with_new_stripe_customer_id, update_user_record_with_new_stripe_customer_id_with_connection};
use mysql_queries::queries::users::user_subscriptions::get_user_subscription_by_stripe_subscription_id::{get_user_subscription_by_stripe_subscription_id, get_user_subscription_by_stripe_subscription_id_with_connection};
use mysql_queries::queries::users::user_subscriptions::get_user_subscription_by_stripe_subscription_id_transactional::get_user_subscription_by_stripe_subscription_id_transactional;
use mysql_queries::queries::users::user_subscriptions::upsert_user_subscription_by_stripe_id::UpsertUserSubscription;
use reusable_types::server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, MySqlConnection, MySqlPool, Transaction};
use stripe_shared::Subscription;

/// Handle event type: 'customer.subscription.created'
/// Sent when the subscription is created. The subscription status may be incomplete if customer
/// authentication is required to complete the payment or if you set payment_behavior to
/// default_incomplete. For more details, read about subscription payment behavior.
pub async fn customer_subscription_created_handler(
  subscription: &Subscription,
  server_environment: ServerEnvironment,
  transaction: &mut Transaction<'_, MySql>,
) -> Result<WebhookEventLogSummary, StripeArtcraftWebhookError> {

  let summary = subscription_summary_extractor(subscription)
      .map_err(|err| {
        let reason = format!("Error extracting subscription from 'customer.subscription.created' payload: {:?}", err);
        error!("{}", reason);
        StripeArtcraftWebhookError::ServerError(reason) // NB: This was probably *our* fault.
      })?;

  let mut result = WebhookEventLogSummary {
    maybe_user_token: summary.user_token.clone(),
    maybe_event_entity_id: Some(summary.stripe_subscription_id.clone()),
    maybe_stripe_customer_id: Some(summary.stripe_customer_id.clone()),
    action_was_taken: false,
    should_ignore_retry: false,
  };

  let maybe_existing_subscription = get_user_subscription_by_stripe_subscription_id_transactional(
    &summary.stripe_subscription_id, transaction)
      .await
      .map_err(|err| {
        let reason = format!("Mysql error: {:?}", err);
        error!("{}", reason);
        StripeArtcraftWebhookError::ServerError(reason)
      })?;

  // NB: It's possible to receive events out of order.
  // We won't want to play a `create` event on top.
  if maybe_existing_subscription.is_some() {
    result.should_ignore_retry = true;
    return Ok(result);
  }
  
  let maybe_product = get_artcraft_product_by_stripe_id_and_env(
    &summary.stripe_product_id, server_environment);
  
  let product = match maybe_product {
    Some(StripeArtcraftGenericProductInfo::Subscription(subscription)) => subscription,
    Some(StripeArtcraftGenericProductInfo::CreditsPack(credits_pack)) => {
      error!("Received 'customer.subscription.updated' for a credits pack product ({}). This should not happen.", &credits_pack.slug.to_str());
      result.should_ignore_retry = true;
      return Ok(result);
    }
    None => {
      error!("No matching product for stripe product ID: {}", &summary.stripe_product_id);
      result.should_ignore_retry = true;
      return Ok(result);
    }
  };

  if let Some(user_token) = summary.user_token.as_ref() {
    // TODO: record cancel_at (future_cancel_at), canceled_at, ended_at (if subscription ended, when it ended), start_date

    let upsert = UpsertUserSubscription {
        stripe_subscription_id: &summary.stripe_subscription_id,
        user_token: user_token.as_str(),
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

    let _r = upsert.upsert_with_transaction(transaction)
        .await
        .map_err(|err| {
            let reason = format!("Mysql error: {:?}", err);
            error!("{}", reason);
            StripeArtcraftWebhookError::ServerError(reason)
        })?;

    // // TODO: Should we care if a user accidentally gets two stripe customer IDs and this
    // //  overwrites one of them?
    // update_user_record_with_new_stripe_customer_id_with_connection(
    //   transaction,
    //   user_token,
    //   Some(&summary.stripe_customer_id))
    //     .await
    //     .map_err(|err| {
    //         let reason = format!("Mysql error: {:?}", err);
    //         error!("{}", reason);
    //         StripeArtcraftWebhookError::ServerError(reason)
    //     })?;

    result.action_was_taken = true;
  }

  result.should_ignore_retry = true;

  Ok(result)
}
