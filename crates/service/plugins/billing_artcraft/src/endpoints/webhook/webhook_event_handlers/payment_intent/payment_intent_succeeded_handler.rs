use crate::configs::stripe_artcraft_metadata_keys::STRIPE_ARTCRAFT_METADATA_USER_TOKEN;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_summary::StripeArtcraftWebhookSummary;
use crate::requests::lookup_purchase_from_payment_intent_success::lookup_purchase_from_payment_intent_success;
use crate::utils::expand_ids::expand_customer_id::expand_customer_id;
use log::{error, info};
use stripe::Client;
use stripe_checkout::checkout_session::ListCheckoutSession;
use stripe_shared::PaymentIntent;

// Handle event type: 'payment_intent.succeeded'
pub async fn payment_intent_succeeded_handler(
  payment_intent: &PaymentIntent,
  stripe_client: &Client
) -> Result<StripeArtcraftWebhookSummary, StripeArtcraftWebhookError> {

  let payment_intent_id = payment_intent.id.to_string();

  // NB: We'll need this to send them to the "customer portal", which is how they can modify
  // or cancel their subscriptions.
  let maybe_stripe_customer_id  = payment_intent.customer
      .as_ref()
      .map(|c| expand_customer_id(c));

  // NB: Our internal user token.
  let maybe_user_token = payment_intent.metadata.get(STRIPE_ARTCRAFT_METADATA_USER_TOKEN)
      .map(|t| t.to_string());

  let mut should_ignore_retry = false;
  let mut action_was_taken = false;

  // Payment intent events are bare. They have absolutely no context about what they were for.
  // No products, no checkout sessions, etc. We'll have to look them up on success.

  let payment_succeeded = match payment_intent.status {
    stripe_shared::PaymentIntentStatus::Succeeded => true,
    _ => false,
  };

  if payment_succeeded {
    info!("Payment intent succeeded. Looking up payment...");

    let purchase = lookup_purchase_from_payment_intent_success(&payment_intent_id, stripe_client)
        .await
        .map_err(|err| {
          error!("Error looking up purchase from payment intent {}: {:?}", &payment_intent_id, err);
          StripeArtcraftWebhookError::ServerError("error looking up purchase".to_string())
        })?;

    if purchase.has_invoice {
      // Subscription purchase. Let `invoice.paid` event handle this instead.
      should_ignore_retry = true;
      action_was_taken = false;
    } else {
      // TODO: Add credits.

      info!(">>> ONE OFF PURCHASE : {:?}", &purchase);
      info!(">>> ONE OFF PURCHASE : {:?}", &purchase);
      info!(">>> ONE OFF PURCHASE : {:?}", &purchase);
      info!(">>> ONE OFF PURCHASE : {:?}", &purchase);
      info!(">>> ONE OFF PURCHASE : {:?}", &purchase);

      should_ignore_retry = true;
      action_was_taken = true;
    }
  }

  Ok(StripeArtcraftWebhookSummary {
    maybe_user_token,
    maybe_event_entity_id: Some(payment_intent_id),
    maybe_stripe_customer_id,
    action_was_taken,
    should_ignore_retry,
  })
}
