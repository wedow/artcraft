use crate::endpoints::webhook::webhook_event_handlers::charge::charge_succeeded_handler::charge_succeeded_handler;
use crate::endpoints::webhook::webhook_event_handlers::checkout_session::checkout_session_completed_handler::checkout_session_completed_handler;
use crate::endpoints::webhook::webhook_event_handlers::customer::customer_created_handler::customer_created_handler;
use crate::endpoints::webhook::webhook_event_handlers::customer::customer_deleted_handler::customer_deleted_handler;
use crate::endpoints::webhook::webhook_event_handlers::customer::customer_updated_handler::customer_updated_handler;
use crate::endpoints::webhook::webhook_event_handlers::customer_subscription::customer_subscription_created_handler::customer_subscription_created_handler;
use crate::endpoints::webhook::webhook_event_handlers::customer_subscription::customer_subscription_updated_handler::customer_subscription_updated_handler;
use crate::endpoints::webhook::webhook_event_handlers::invoice::invoice_paid_handler::invoice_paid_handler;
use crate::endpoints::webhook::webhook_event_handlers::invoice::invoice_payment_failed::invoice_payment_failed_handler;
use crate::endpoints::webhook::webhook_event_handlers::invoice::invoice_payment_succeeded_handler::invoice_payment_succeeded_handler;
use crate::endpoints::webhook::webhook_event_handlers::invoice::invoice_updated_handler::invoice_updated_handler;
use crate::endpoints::webhook::webhook_event_handlers::payment_intent::payment_intent_succeeded_handler::payment_intent_succeeded_handler;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_summary::StripeArtcraftWebhookSummary;
use log::warn;
use reusable_types::server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use stripe_webhook::{Event, EventObject};
use crate::endpoints::webhook::webhook_event_handlers::customer_subscription::customer_subscription_deleted_handler::customer_subscription_deleted_handler;

pub async fn handle_webhook_payload(
  mysql_connection: &mut PoolConnection<MySql>,
  server_environment: ServerEnvironment,
  webhook_payload: Event,
  stripe_event_type: &String
) -> Result<StripeArtcraftWebhookSummary, StripeArtcraftWebhookError> {
  let mut unhandled_event_type = false;

  let mut webhook_summary = StripeArtcraftWebhookSummary {
    maybe_user_token: None,
    maybe_event_entity_id: None,
    maybe_stripe_customer_id: None,
    action_was_taken: false,
    should_ignore_retry: false,
  };

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

  match webhook_payload.data.object {

    // =============== CHECKOUT SESSIONS ===============

    // TODO: Provision the subscription here.
    EventObject::CheckoutSessionCompleted(checkout_session) => {
      // Checkout session completion is ideal for provisioning the service after checkout.
      webhook_summary = checkout_session_completed_handler(checkout_session)?;
    }

    // EventObject::CheckoutSessionAsyncPaymentFailed(_) => {}
    // EventObject::CheckoutSessionAsyncPaymentSucceeded(_) => {}
    // EventObject::CheckoutSessionExpired(_) => {}

    // =============== CUSTOMER SUBSCRIPTIONS ===============

    EventObject::CustomerSubscriptionCreated(subscription) => {
      webhook_summary = customer_subscription_created_handler(
        &subscription,
        server_environment,
        mysql_connection,
      ).await?;
    }

    EventObject::CustomerSubscriptionUpdated(subscription) => {
      webhook_summary = customer_subscription_updated_handler(
        &subscription,
        server_environment,
        mysql_connection,
      ).await?;
    }

    EventObject::CustomerSubscriptionDeleted(subscription) => {
      webhook_summary = customer_subscription_deleted_handler(
        &subscription,
        server_environment,
        mysql_connection,
      ).await?;
    }

    // EventObject::CustomerSubscriptionPendingUpdateApplied(_) => {}
    // EventObject::CustomerSubscriptionPendingUpdateExpired(_) => {}
    // EventObject::CustomerSubscriptionTrialWillEnd(_) => {}

    // =============== INVOICES ===============

    EventObject::InvoicePaid(invoice) => {
      webhook_summary = invoice_paid_handler(&invoice)?;
    }
    EventObject::InvoiceCreated(_invoice) => {
      // TODO: We need to respond to this so we don't hold payments up by 72 hours!
      //  See: https://stripe.com/docs/billing/subscriptions/webhooks
    }
    EventObject::InvoiceUpdated(invoice) => {
      webhook_summary = invoice_updated_handler(&invoice)?;
    }
    EventObject::InvoicePaymentSucceeded(invoice) => {
      webhook_summary = invoice_payment_succeeded_handler(&invoice)?;
    }
    EventObject::InvoicePaymentFailed(invoice) => {
      webhook_summary = invoice_payment_failed_handler(&invoice)?;
    }

    // EventObject::InvoiceDeleted(_) => {}
    // EventObject::InvoiceFinalizationFailed(_) => {}
    // EventObject::InvoiceFinalized(_) => {}
    // EventObject::InvoiceItemCreated(_) => {}
    // EventObject::InvoiceItemDeleted(_) => {}
    // EventObject::InvoiceItemUpdated(_) => {}
    // EventObject::InvoiceMarkedUncollectible(_) => {}
    // EventObject::InvoicePaymentActionRequired(_) => {}
    // EventObject::InvoiceSent(_) => {}
    // EventObject::InvoiceUpcoming(_) => {}
    // EventObject::InvoiceUpdated(_) => {}
    // EventObject::InvoiceVoided(_) => {}

    // =============== PAYMENT INTENTS ===============

    EventObject::PaymentIntentSucceeded(payment_intent) => {
      webhook_summary = payment_intent_succeeded_handler(&payment_intent)?;
    }

    // EventType::PaymentIntentAmountCapturableUpdated => {}
    // EventType::PaymentIntentCanceled => {}
    // EventType::PaymentIntentCreated => {}
    // EventType::PaymentIntentPartiallyFunded => {}
    // EventType::PaymentIntentPaymentFailed => {}
    // EventType::PaymentIntentProcessing => {}
    // EventType::PaymentIntentRequiresAction => {}
    // EventType::PaymentIntentRequiresCapture => {}

    // =============== CHARGES ===============

    EventObject::ChargeSucceeded(charge) => {
      webhook_summary = charge_succeeded_handler(&charge)?;
    }

    // =============== Ignored ===============

    // Ignoring these types (NOTE: This is from the old async-stripe version):
    //   Account* (6),
    //   ApplicationFee* (2),
    //   BalanceAvailable (1),
    //   BillingPortal* (2),
    //   CapabilityCreated (1),
    //   Charge* (13),
    //   [CheckoutSession* handled above],
    //   Coupon* (3),
    //   CreditNote* (3),
    //   CustomerDiscount* (3),
    //   CustomerSource* (4),
    //   [CustomerSubscription* handled above],
    //   CreditTax* (3),
    //   FileCreated (1),
    //   IdentityVerification* (6),
    //   [Invoice* handled above],
    //   IssuingAuthorization* (3),
    //   IssuingCard* (2),
    //   IssuingCardholder* (2),
    //   IssuingDispute* (2),
    //   IssuingTransaction* (2),
    //   MandateUpdated (1),
    //   Order* (6),
    //   [PaymentIntent* handled above],
    //   PaymentLink* (2),
    //   PaymentMethod* (4),
    //   Payout* (5),
    //   Person* (3),
    //   Plan* (3),
    //   Price* (3),
    //   Product* (3),
    //   PromotionCode* (2),
    //   Quote* (4),
    //   RadarEarlyFraudWarning* (2),
    //   Recipient* (3),
    //   ReportingReport* (3),
    //   Review* (2),
    //   SetupIntent* (5), -- N/A; collecting payments in the future we don't yet have information for (eg. crowdfunding, rental car, utility bill)
    //   SubscriptionSchedule* (7), -- N/A; backdate subscriptions or schedule one to start later (eg. for physical goods, like a newspaper)
    //   SigmaScheduledQueryRunCreated (1),
    //   Sku (3),
    //   Source* (7),
    //   TaxRate* (2),
    //   TerminalReader* (2),
    //   TestHelpersTestClock* (5),
    //   Topup* (5),
    //   Transfer* (5),

    _ => {
      unhandled_event_type = true;
    },
  }

  // To play with the payload contents as JSON:
  // let json = serde_json::ser::to_string(&event_payload).unwrap();
  // info!("event payload as json: {}", json);

  if unhandled_event_type {
    warn!("Unhandled Stripe webhook event type: {} ({:?})",
      &stripe_event_type,
      &webhook_payload.type_);
  }

  Ok(webhook_summary)
}
