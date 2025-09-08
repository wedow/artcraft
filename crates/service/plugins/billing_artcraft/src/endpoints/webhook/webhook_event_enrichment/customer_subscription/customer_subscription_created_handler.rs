use crate::billing_action_fulfillment::artcraft_billing_action::{ArtcraftBillingAction, UpsertableSubscriptionDetails, WalletCreditsPurchaseEvent};
use crate::configs::get_artcraft_product_by_stripe_id_and_env::get_artcraft_product_by_stripe_id_and_env;
use crate::configs::stripe_artcraft_generic_product_info::StripeArtcraftGenericProductInfo;
use crate::endpoints::webhook::common::enriched_webhook_event::EnrichedWebhookEvent;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::common::webhook_event_log_summary::WebhookEventLogSummary;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::calculate_subscription_end_date::calculate_subscription_end_date;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::subscription_event_extractor::subscription_summary_extractor;
use crate::utils::metadata::get_metadata_user_token::get_metadata_user_token;
use crate::utils::metadata::get_metadata_wallet_token::get_metadata_wallet_token;
use enums::common::subscription_namespace::SubscriptionNamespace;
use log::{error, warn};
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
) -> Result<EnrichedWebhookEvent, StripeArtcraftWebhookError> {

  let summary = subscription_summary_extractor(subscription)
      .map_err(|err| {
        let reason = format!("Error extracting subscription from 'customer.subscription.created' payload: {:?}", err);
        error!("{}", reason);
        StripeArtcraftWebhookError::ServerError(reason) // NB: This was probably *our* fault.
      })?;

  let mut event_log_summary = WebhookEventLogSummary {
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
    event_log_summary.should_ignore_retry = true;
    return Ok(EnrichedWebhookEvent::from_actionless_log(event_log_summary));
  }
  
  let maybe_product = get_artcraft_product_by_stripe_id_and_env(
    &summary.stripe_product_id, server_environment);


  let product = match maybe_product {
    Some(StripeArtcraftGenericProductInfo::Subscription(subscription)) => subscription,
    Some(StripeArtcraftGenericProductInfo::CreditsPack(credits_pack)) => {
      error!("Received 'customer.subscription.updated' for a credits pack product ({}). This should not happen.", &credits_pack.slug.to_str());
      event_log_summary.should_ignore_retry = true;
      return Ok(EnrichedWebhookEvent::from_actionless_log(event_log_summary));
    }
    None => {
      error!("No matching product for stripe product ID: {}", &summary.stripe_product_id);
      event_log_summary.should_ignore_retry = true;
      return Ok(EnrichedWebhookEvent::from_actionless_log(event_log_summary));
    }
  };

  // TODO: Multiple ways to get this; better ways to get this
  let user_token = match &summary.user_token {
    Some(token) => token.clone(),
    None => {
      warn!("No user token found in `customer.subscription.created` metadata. Cannot proceed.");
      return Err(StripeArtcraftWebhookError::BadRequest("no user token in customer.subscription.created".to_string()));
    }
  };

  event_log_summary.should_ignore_retry = true;

  let calculated_end_date = calculate_subscription_end_date(&summary);

  Ok(EnrichedWebhookEvent {
    maybe_billing_action: Some(ArtcraftBillingAction::SubscriptionCreated(
      UpsertableSubscriptionDetails {
        // Unique Stripe foreign key
        stripe_customer_id: summary.stripe_customer_id,

        // Other Stripe foreign keys
        stripe_subscription_id: summary.stripe_subscription_id,
        stripe_price_id: summary.stripe_price_id,
        stripe_product_id: summary.stripe_product_id.clone(), // TODO: Avoid clone.

        // Artcraft info
        subscription: product.clone(), // TODO: Avoid clone
        owner_user_token: user_token,

        // Status
        stripe_subscription_status: summary.stripe_subscription_status,

        // Timing data
        stripe_recurring_interval: summary.subscription_interval,
        calculated_subscription_expires_at: calculated_end_date,
        subscription_start_at: summary.subscription_start_date,
        current_billing_period_start_at: summary.current_billing_period_start,
        current_billing_period_end_at: summary.current_billing_period_end,
        maybe_cancel_at: summary.maybe_cancel_at,
        maybe_canceled_at: summary.maybe_canceled_at,

        // Misc
        stripe_is_production: summary.stripe_is_production,
      })),
    webhook_event_log_summary: event_log_summary,
  })
}
