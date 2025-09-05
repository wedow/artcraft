use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_summary::StripeArtcraftWebhookSummary;
use crate::utils::expand_ids::expand_customer_id::expand_customer_id;
use crate::utils::expand_ids::expand_subscription_id::expand_subscription_id;
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
pub fn invoice_paid_handler(invoice: &Invoice) -> Result<StripeArtcraftWebhookSummary, StripeArtcraftWebhookError> {

  let is_paid = match invoice.status {
    Some(InvoiceStatus::Paid) => true,
    _ => false,
  };

  let is_production= invoice.livemode;

  let paid_status = invoice.status;

  let maybe_stripe_customer_id  = invoice.customer
      .as_ref()
      .map(|c| expand_customer_id(c));

  let maybe_stripe_subscription_id = invoice.subscription
      .as_ref()
      .map(|s| expand_subscription_id(s));

  Ok(StripeArtcraftWebhookSummary {
    maybe_user_token: None,
    maybe_event_entity_id: None,
    maybe_stripe_customer_id: None,
    action_was_taken: false,
    should_ignore_retry: false,
  })
}
