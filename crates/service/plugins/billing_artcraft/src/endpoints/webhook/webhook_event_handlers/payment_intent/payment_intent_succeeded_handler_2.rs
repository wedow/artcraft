use crate::configs::get_artcraft_product_by_stripe_id_and_env::get_artcraft_product_by_stripe_id_and_env;
use crate::configs::stripe_artcraft_generic_product_info::StripeArtcraftGenericProductInfo;
use crate::configs::subscriptions::stripe_artcraft_subscription_info::StripeArtcraftSubscriptionInfo;
use crate::endpoints::webhook::common::artcraft_billing_event::ArtcraftBillingEvent;
use crate::endpoints::webhook::common::billing_action::{BillingAction, IgnoreableEventType, WalletCreditsPurchaseEvent};
use crate::endpoints::webhook::common::event_log_summary::WebhookEventLogSummary;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_summary::StripeArtcraftWebhookSummary;
use crate::fulfillment::credits_pack::complete_credits_pack_purchase::complete_credits_pack_purchase;
use crate::requests::lookup_purchase_from_payment_intent_success::lookup_purchase_from_payment_intent_success;
use crate::utils::expand_ids::expand_customer_id::expand_customer_id;
use crate::utils::metadata::get_metadata_user_token::get_metadata_user_token;
use crate::utils::metadata::get_metadata_wallet_token::get_metadata_wallet_token;
use log::{error, info, warn};
use reusable_types::server_environment::ServerEnvironment;
use sqlx::{MySql, Transaction};
use stripe::Client;
use stripe_checkout::checkout_session::ListCheckoutSession;
use stripe_shared::PaymentIntent;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

// Handle event type: 'payment_intent.succeeded'
pub async fn payment_intent_succeeded_handler_2(
  payment_intent: &PaymentIntent,
  server_environment: ServerEnvironment,
  stripe_client: &Client,
) -> Result<ArtcraftBillingEvent, StripeArtcraftWebhookError> {

  let payment_intent_id = payment_intent.id.to_string();

  // NB: We'll need this to send them to the "customer portal", which is how they can modify
  // or cancel their subscriptions.
  let maybe_stripe_customer_id  = payment_intent.customer
      .as_ref()
      .map(|c| expand_customer_id(c));

  // NB: Our internal tokens
  let maybe_user_token = get_metadata_user_token(&payment_intent.metadata);
  let maybe_wallet_token = get_metadata_wallet_token(&payment_intent.metadata);

  // TODO: Multiple ways to get this; better ways to get this
  let user_token = match &maybe_user_token {
    Some(token) => token.clone(),
    None => {
      warn!("No user token found in payment intent metadata. Cannot proceed.");
      return Err(StripeArtcraftWebhookError::BadRequest("no user token in payment intent".to_string()));
    }
  };
  
  let mut event_log_summary = WebhookEventLogSummary {
    maybe_stripe_customer_id,
    maybe_user_token,
    maybe_event_entity_id: Some(payment_intent_id.clone()),
    action_was_taken: false,
    should_ignore_retry: true,
  };

  // Payment intent events are bare. They have absolutely no context about what they were for.
  // No products, no checkout sessions, etc. We'll have to look them up on success.

  let payment_succeeded = match payment_intent.status {
    stripe_shared::PaymentIntentStatus::Succeeded => true,
    _ => false,
  };
  
  if !payment_succeeded {
    event_log_summary.should_ignore_retry = true;
    
    return Ok(ArtcraftBillingEvent {
      action: BillingAction::IgnorableEvent { 
        description: "payment_intent not succeeded".to_string(),
        event_type: IgnoreableEventType::PaymentIntentFailed,
      },
      webhook_event_log_summary: event_log_summary,
    });
  }

  info!("Payment intent succeeded. Looking up payment...");

  let purchase = lookup_purchase_from_payment_intent_success(&payment_intent_id, stripe_client)
      .await
      .map_err(|err| {
        error!("Error looking up purchase from payment intent {}: {:?}", &payment_intent_id, err);
        StripeArtcraftWebhookError::ServerError("error looking up purchase".to_string())
      })?;
  
  if !purchase.has_invoice {
    // Subscription purchase. Let `invoice.paid` event handle this instead.
    event_log_summary.should_ignore_retry = true;
    
    return Ok(ArtcraftBillingEvent {
      action: BillingAction::IgnorableEvent {
        event_type: IgnoreableEventType::PaymentIntentForSubscription,
        description: "payment_intent for subscription; will handle via invoice.paid".to_string(),
      },
      webhook_event_log_summary: event_log_summary,
    });
  }

  let credits_pack = match get_artcraft_product_by_stripe_id_and_env(&purchase.product_id, server_environment) {
    None => {
      error!("Could not find product for ID: {}", &purchase.product_id);
      return Err(StripeArtcraftWebhookError::ServerError("unknown product".to_string()));
    }
    Some(StripeArtcraftGenericProductInfo::Subscription(_subscription)) => {
      info!("Do not handle subscriptions as one-off payments: {}", purchase.product_id);
      event_log_summary.should_ignore_retry = true;

      return Ok(ArtcraftBillingEvent {
        action: BillingAction::IgnorableEvent {
          event_type: IgnoreableEventType::PaymentIntentForSubscription,
          description: "payment_intent for subscription; will handle via invoice.paid".to_string(),
        },
        webhook_event_log_summary: event_log_summary,
      });
    }
    Some(StripeArtcraftGenericProductInfo::CreditsPack(credits_pack)) => credits_pack,
  };

  Ok(ArtcraftBillingEvent {
    action: BillingAction::WalletCreditsPurchase(WalletCreditsPurchaseEvent {
      owner_user_token: user_token,
      maybe_wallet_token: None, // TODO: Use the checkout session to set this !
      pack: credits_pack.clone(),
      quantity: purchase.quantity,
    }),
    webhook_event_log_summary: event_log_summary,
  })
}
