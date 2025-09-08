use crate::billing_action_fulfillment::artcraft_billing_action::{ArtcraftBillingAction, SubscriptionPaidEvent, WalletCreditsPurchaseEvent};
use crate::endpoints::webhook::common::enriched_webhook_event::EnrichedWebhookEvent;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::common::webhook_event_log_summary::WebhookEventLogSummary;
use crate::requests::lookup_subscription_from_subscription_id::lookup_subscription_from_subscription_id;
use crate::utils::expand_ids::expand_customer_id::expand_customer_id;
use crate::utils::expand_ids::expand_subscription_id::expand_subscription_id;
use crate::utils::metadata::get_metadata_user_token::get_metadata_user_token;
use log::{info, warn};
use stripe::Client;
use stripe_shared::{Invoice, InvoiceStatus};

// Handle event type: 'invoice.paid'
//
// Invoices are generated for subscriptions, not one-off charges and purchases.
//
// https://stripe.com/docs/billing/subscriptions/webhooks :
//
// Sent when the invoice is successfully paid. You can provision access to your product when you
// receive this event and the subscription `status` is `active`.
//
// https://stripe.com/docs/billing/subscriptions/webhooks#active-subscriptions :
//
// 1. A few days prior to renewal, your site receives an invoice.upcoming event at the webhook
//    endpoint. You can listen for this event to add extra invoice items to the upcoming invoice.
// 2. Your site receives an invoice.paid event.
// 3. Your webhook endpoint finds the customer the payment was made for.
// 4. Your webhook endpoint updates the customer’s access expiration date in your database to the
//    appropriate date in the future (plus a day or two for leeway).
//
pub async fn invoice_paid_handler(
  invoice: &Invoice,
  stripe_client: &Client,
) -> Result<EnrichedWebhookEvent, StripeArtcraftWebhookError> {

  let maybe_user_token = invoice.metadata
      .as_ref()
      .map(|metadata| get_metadata_user_token(metadata))
      .flatten();

  let is_production= invoice.livemode;

  let maybe_stripe_customer_id  = invoice.customer
      .as_ref()
      .map(|c| expand_customer_id(c));

  let maybe_stripe_subscription_id = invoice.subscription
      .as_ref()
      .map(|s| expand_subscription_id(s));

  let mut event_log_summary = WebhookEventLogSummary {
    maybe_stripe_customer_id,
    maybe_user_token,
    maybe_event_entity_id: None,
    action_was_taken: false,
    should_ignore_retry: true,
  };

  let is_paid = match invoice.status {
    Some(InvoiceStatus::Paid) => true,
    _ => false,
  };

  if !is_paid {
    info!("Invoice is not paid...");
    return Ok(EnrichedWebhookEvent::from_actionless_log(event_log_summary));
  }

  let subscription_id = match maybe_stripe_subscription_id {
    Some(subscription_id) => subscription_id,
    None => {
      info!("Invoice is not for a subscription; skipping ...");
      return Ok(EnrichedWebhookEvent::from_actionless_log(event_log_summary));
    }
  };

  info!("Calling Stripe to look up subscription info...");
  
  let subscription = lookup_subscription_from_subscription_id(
    &subscription_id, stripe_client).await?;

  // TODO: Multiple ways to get this; better ways to get this
  let user_token = match &subscription.maybe_user_token {
    Some(token) => token.clone(),
    None => {
      warn!("No user token found in subscription metadata. Cannot proceed.");
      return Err(StripeArtcraftWebhookError::BadRequest("no user token in subscription metadata".to_string()));
    }
  };

  info!("Invoice paid is for subscription.");

  Ok(EnrichedWebhookEvent {
    maybe_billing_action: Some(ArtcraftBillingAction::SubscriptionPaid(SubscriptionPaidEvent {
      stripe_subscription_id: subscription_id,
      stripe_customer_id: subscription.customer_id,
      stripe_product_id: subscription.product_id,
      stripe_price_id: subscription.price_id,
      owner_user_token: user_token,
    })),
    webhook_event_log_summary: event_log_summary,
  })
}
