use crate::configs::get_artcraft_product_by_stripe_id_and_env::get_artcraft_product_by_stripe_id_and_env;
use crate::configs::stripe_artcraft_generic_product_info::StripeArtcraftGenericProductInfo;
use crate::configs::stripe_artcraft_metadata_keys::STRIPE_ARTCRAFT_METADATA_USER_TOKEN;
use crate::configs::subscriptions::stripe_artcraft_subscription_info::StripeArtcraftSubscriptionInfo;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_handlers::stripe_artcraft_webhook_summary::StripeArtcraftWebhookSummary;
use crate::fulfillment::credits_pack::complete_credits_pack_purchase::complete_credits_pack_purchase;
use crate::requests::lookup_purchase_from_payment_intent_success::lookup_purchase_from_payment_intent_success;
use crate::utils::expand_ids::expand_customer_id::expand_customer_id;
use log::{error, info, warn};
use reusable_types::server_environment::ServerEnvironment;
use sqlx::{MySql, Transaction};
use stripe::Client;
use stripe_checkout::checkout_session::ListCheckoutSession;
use stripe_shared::PaymentIntent;
use tokens::tokens::users::UserToken;

// Handle event type: 'payment_intent.succeeded'
pub async fn payment_intent_succeeded_handler(
  payment_intent: &PaymentIntent,
  server_environment: ServerEnvironment,
  stripe_client: &Client,
  transaction: &mut Transaction<'_, MySql>,
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

  // TODO: Multiple ways to get this; better ways to get this
  let user_token = match &maybe_user_token {
    Some(token) => UserToken::new_from_str(token),
    None => {
      warn!("No user token found in payment intent metadata. Cannot proceed.");
      return Err(StripeArtcraftWebhookError::BadRequest("no user token in payment intent".to_string()));
    }
  };

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


    // TODO TODO TODO
    // TODO TODO TODO - DO NOT DO A TRANSACTION WITH HTTP REQUESTS!!! Move this logic out!
    // TODO TODO TODO
    // TODO: Summarize the webhook into an internal event, then process that in an atomic transaction.
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");
    warn!("DO NOT KEEP THIS REQUEST WITHIN A TRANSACTION - MOVE IT OUT!!!");

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
      match get_artcraft_product_by_stripe_id_and_env(&purchase.product_id, server_environment) {
        None => {
          error!("Could not find product for ID: {}", &purchase.product_id);
          return Err(StripeArtcraftWebhookError::ServerError("unknown product".to_string()));
        }
        Some(StripeArtcraftGenericProductInfo::Subscription(subscription)) => {
          info!("Do not handle subscriptions as one-off payments: {}", purchase.product_id);
          should_ignore_retry = true;
          action_was_taken = false;
        }
        Some(StripeArtcraftGenericProductInfo::CreditsPack(credits_pack)) => {
          info!("Fulfilling one-time payment...");
          complete_credits_pack_purchase(
            &user_token,
            credits_pack,
            purchase.quantity,
            transaction,
          ).await?;

          should_ignore_retry = true;
          action_was_taken = true;
        }
      }
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
