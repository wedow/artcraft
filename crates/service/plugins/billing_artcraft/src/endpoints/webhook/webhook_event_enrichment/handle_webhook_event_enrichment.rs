use crate::endpoints::webhook::common::enriched_webhook_event::EnrichedWebhookEvent;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::common::webhook_event_log_summary::WebhookEventLogSummary;
use crate::endpoints::webhook::webhook_event_enrichment::checkout_session::checkout_session_completed_handler::checkout_session_completed_handler;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::customer_subscription_created_handler::customer_subscription_created_handler;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::customer_subscription_deleted_handler::customer_subscription_deleted_handler;
use crate::endpoints::webhook::webhook_event_enrichment::customer_subscription::customer_subscription_updated_handler::customer_subscription_updated_handler;
use crate::endpoints::webhook::webhook_event_enrichment::ignore_known_unwanted_events::ignore_known_unwanted_events;
use crate::endpoints::webhook::webhook_event_enrichment::invoice::invoice_paid_handler::invoice_paid_handler;
use crate::endpoints::webhook::webhook_event_enrichment::invoice::invoice_payment_failed::invoice_payment_failed_handler;
use crate::endpoints::webhook::webhook_event_enrichment::payment_intent::payment_intent_succeeded_extractor::payment_intent_succeeded_extractor;
use crate::utils::stripe_event_descriptor::StripeEventDescriptor;
use log::{info, warn};
use reusable_types::server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, Transaction};
use stripe::Client;
use stripe_webhook::{Event, EventObject};

/*
  You usually need these:
    1. Subscription events: to track contract state (active, canceled, past_due, trialing, etc.).
    2. Invoice events: to track actual money flow and handle edge cases like failed payments, dunning, or refunds.

  Minimal Set to Cover Payment Lifecycle
    -	invoice.paid → confirm credits or entitlements
    -	invoice.payment_failed → trigger dunning or downgrade access
    -	customer.subscription.deleted → stop service when canceled
    -	customer.subscription.updated → react to upgrades, downgrades, trial end
    -	(Optionally) checkout.session.completed → provision on signup
*/

pub async fn handle_webhook_event_enrichment(
  stripe_event_descriptor: &StripeEventDescriptor,
  stripe_client: &Client,
  server_environment: ServerEnvironment,
  webhook_payload: Event,
) -> Result<EnrichedWebhookEvent, StripeArtcraftWebhookError> {

  if let Some(summary) = ignore_known_unwanted_events(&webhook_payload) {
    return Ok(EnrichedWebhookEvent {
      maybe_billing_action: None,
      webhook_event_log_summary: summary,
    });
  }

  let mut unhandled_event_type = false;

  let mut webhook_summary = WebhookEventLogSummary {
    maybe_user_token: None,
    maybe_event_entity_id: None,
    maybe_stripe_customer_id: None,
    action_was_taken: false,
    should_ignore_retry: false,
  };

  match webhook_payload.data.object {

    // =============== PAYMENT INTENTS ===============

    EventObject::PaymentIntentSucceeded(payment_intent) => {
      // `payment_intent.succeeded` is responsible for enabling one-off payments (eg. credits packs).
      // We'll ignore any payment intents from subscription invoices and let other event handlers
      // fulfill subscription states.
      info!("Event {}, data: {:?}", stripe_event_descriptor, payment_intent);
      return payment_intent_succeeded_extractor(
        &payment_intent,
        server_environment,
        stripe_client,
      ).await;
    }

    // =============== CUSTOMER SUBSCRIPTIONS ===============

    EventObject::CustomerSubscriptionCreated(subscription) => {
      // DO NOT USE TO PROVISION SERVICE.
      //
      // Sent when the subscription is created. The subscription status may be incomplete if customer
      // authentication is required to complete the payment or if you set payment_behavior to
      // default_incomplete. For more details, read about subscription payment behavior.
      ///
      // This can be used to upsert the subscription record, but may be `incomplete` and unpaid.
      // This is good for the overall subscription state, renewal dates, etc.
      //
      info!("Event: {}, data: {:?}", stripe_event_descriptor, subscription);
      return customer_subscription_created_handler(
        &subscription,
        server_environment,
      ).await;
    }

    EventObject::CustomerSubscriptionUpdated(subscription) => {
      info!("Event: {}, data: {:?}", stripe_event_descriptor, subscription);
      return customer_subscription_updated_handler(
        &subscription,
        server_environment,
      ).await;
    }

    EventObject::CustomerSubscriptionDeleted(subscription) => {
      info!("Event: {}, data: {:?}", stripe_event_descriptor, subscription);
      return customer_subscription_deleted_handler(
        &subscription,
        server_environment,
      ).await;
    }

    // =============== INVOICES ===============

    EventObject::InvoiceCreated(_invoice) => {
      // TODO: We need to respond to this so we don't hold payments up by 72 hours!
      //  See: https://stripe.com/docs/billing/subscriptions/webhooks
    }

    EventObject::InvoicePaid(invoice) => {
      // Invoices are for subscriptions, not one-off charges and purchases.
      // This is the *required* event that enables the subscription!
      // These are fired on an interval - whatever the billing cadence is.
      info!("Event: {}, data: {:?}", stripe_event_descriptor, invoice);
      return invoice_paid_handler(
        &stripe_event_descriptor,
        &invoice,
        server_environment,
        stripe_client
      ).await;
    }

    /*EventObject::InvoicePaymentFailed(invoice) => {
      // TODO: Halt service.
      // TODO: in wallet schema, hold a 'lifetime_total_credits_used' - no, that wastes space. `credits_used` then SUM() for reports
      // When we detect invoice payment failures, we need to disable
      // subscription services.
      info!("Event: {:?}, data: {:?}", stripe_event_descriptor, invoice);
      webhook_summary = invoice_payment_failed_handler(&invoice)?;
    }
    */

    // =============== CHECKOUT SESSIONS ===============

    // TODO: Provision the subscription here.
    EventObject::CheckoutSessionCompleted(checkout_session) => {
      info!("Event: {}, data: {:?}", webhook_payload.type_, checkout_session);

      // TODO: DO NOT USE TO PROVISION SERVICE - USE `invoice.paid`.
      //
      // Checkout session completion is ideal for provisioning the service after checkout,
      // but will not be used for monthly subscription renewals, which are handled by
      // invoice.paid events.
      //
      // - `payment_status = {paid, unpaid, no_payment_required}` will let us know
      //    if the funds are in our account. NOTE (2): this will not be `paid` for free
      //    trials, but `invoice.paid` events will fire for free trials. (2): Async
      //    methods like ACH will have the status `unpaid` until the payment
      //    clears.
      //
      // - `subscription` will contain the ID of the subscription in subscription mode.
      //
      // - `metadata` - user token, etc.
      //
      // After the subscription signup succeeds, the customer returns to your website at the success_url,
      // which initiates a checkout.session.completed webhooks. When you receive a checkout.session.completed
      // event, you can provision the subscription. Continue to provision each month (if billing monthly) as
      // you receive invoice.paid events. If you receive an invoice.payment_failed event, notify your customer
      // and send them to the customer portal to update their payment method.
      //
      // Still need to ask about this. - does stripe say we can provision service here?
      // Do we know if this happens for upgrades/downgrades/renewals?
      // What about one-off payments?

      /* TODO: Commented out for now
      webhook_summary = checkout_session_completed_handler(checkout_session)?;
       */
    }

    // =============== Ignored ===============

    _ => {
      unhandled_event_type = true;
    },
  }

  // To play with the payload contents as JSON:
  // let json = serde_json::ser::to_string(&event_payload).unwrap();
  // info!("event payload as json: {}", json);

  if unhandled_event_type {
    warn!("Unhandled Stripe webhook event : {}", &stripe_event_descriptor);
  }

  Ok(EnrichedWebhookEvent {
    maybe_billing_action: None,
    webhook_event_log_summary: webhook_summary,
  })
}
