use crate::billing_action_fulfillment::artcraft_billing_action::{ArtcraftBillingAction, UserCustomerLink};
use crate::endpoints::webhook::common::enriched_webhook_event::EnrichedWebhookEvent;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::common::webhook_event_log_summary::WebhookEventLogSummary;
use crate::utils::metadata::get_metadata_user_token::get_metadata_user_token;
use stripe_shared::Customer;

// This is just to associate an (optional) User <-> Stripe Customer ID link
pub fn customer_updated_handler(customer: Customer) -> Result<EnrichedWebhookEvent, StripeArtcraftWebhookError> {
  let stripe_customer_id = customer.id.to_string();

  let mut maybe_user_token = None;
  let mut maybe_action = None;

  if let Some(metadata) = &customer.metadata {
    maybe_user_token = get_metadata_user_token(metadata);
    
    if let Some(user_token) = &maybe_user_token {
      let link = UserCustomerLink {
        user_token: user_token.clone(),
        stripe_customer_id: stripe_customer_id.clone(),
      };
      
      maybe_action = Some(ArtcraftBillingAction::CustomerUpdated(link));
    }
  }
  
  Ok(EnrichedWebhookEvent {
    maybe_billing_action: maybe_action,
    webhook_event_log_summary: WebhookEventLogSummary {
      maybe_user_token,
      maybe_event_entity_id: None, // TODO?
      maybe_stripe_customer_id: Some(stripe_customer_id),
      action_was_taken: false,
      should_ignore_retry: false,
    },
  })
}
