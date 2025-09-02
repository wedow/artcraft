use crate::configs::stripe_artcraft_metadata_keys::STRIPE_ARTCRAFT_METADATA_USER_TOKEN;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_summary::StripeArtcraftWebhookSummary;
use stripe_core::Customer;

// Handle event type: 'customer.updated'
pub fn customer_updated_handler(customer: &Customer) -> Result<StripeArtcraftWebhookSummary, StripeArtcraftWebhookError> {
  // NB: We'll need this to send them to the "customer portal", which is how they can modify
  // or cancel their subscriptions.
  let customer_id = customer.id.to_string();

  // NB: Our internal user token.
  let maybe_user_token = customer.metadata
      .as_ref()
      .and_then(|m| m.get(STRIPE_ARTCRAFT_METADATA_USER_TOKEN).map(|t| t.to_string()));

  Ok(StripeArtcraftWebhookSummary {
    maybe_user_token,
    maybe_event_entity_id: Some(customer_id.clone()),
    maybe_stripe_customer_id: Some(customer_id.clone()),
    action_was_taken: false,
    should_ignore_retry: false,
  })
}
