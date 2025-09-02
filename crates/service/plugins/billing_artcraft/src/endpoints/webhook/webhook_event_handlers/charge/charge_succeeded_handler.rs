use crate::configs::stripe_artcraft_metadata_keys::STRIPE_ARTCRAFT_METADATA_USER_TOKEN;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_summary::StripeArtcraftWebhookSummary;
use crate::utils::expand_customer_id::expand_customer_id;
use stripe_shared::Charge;

// Handle event type: 'charge.succeeded'
pub fn charge_succeeded_handler(charge: &Charge) -> Result<StripeArtcraftWebhookSummary, StripeArtcraftWebhookError> {
  let charge_id = charge.id.to_string();

  let charge_status = charge.status;

  // NB: We'll need this to send them to the "customer portal", which is how they can modify
  // or cancel their subscriptions.
  let maybe_stripe_customer_id  = charge.customer
      .as_ref()
      .map(|c| expand_customer_id(c));

  // NB: Our internal user token.
  let maybe_user_token = charge.metadata.get(STRIPE_ARTCRAFT_METADATA_USER_TOKEN)
      .map(|t| t.to_string());

  Ok(StripeArtcraftWebhookSummary {
    maybe_user_token,
    maybe_event_entity_id: Some(charge_id),
    maybe_stripe_customer_id,
    action_was_taken: false,
    should_ignore_retry: false,
  })
}
