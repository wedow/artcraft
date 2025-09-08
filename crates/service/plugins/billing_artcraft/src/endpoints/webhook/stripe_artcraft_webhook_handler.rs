use actix_web::web::{Bytes, Data, Json};
use actix_web::{web, HttpRequest, HttpResponse};

use crate::billing_action_fulfillment::transactionally_fulfill_artcraft_billing_action::transactionally_fulfill_artcraft_billing_action;
use crate::endpoints::webhook::common::enriched_webhook_event::EnrichedWebhookEvent;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::endpoints::webhook::webhook_event_enrichment::handle_webhook_event_enrichment::handle_webhook_event_enrichment;
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::stripe_event_descriptor::StripeEventDescriptor;
use crate::utils::verify_stripe_webhook_ip_address::verify_stripe_webhook_ip_address;
use chrono::NaiveDateTime;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use log::{error, info, warn};
use mysql_queries::queries::billing::stripe::get_stripe_webhook_event_log_by_id::{get_stripe_webhook_event_log_by_id, get_stripe_webhook_event_log_by_id_with_connection};
use mysql_queries::queries::billing::stripe::insert_stripe_webhook_event_log::InsertStripeWebhookEventLog;
use reusable_types::server_environment::ServerEnvironment;
use serde_derive::Serialize;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql, MySqlConnection, MySqlPool, Transaction};
use std::sync::Arc;
use stripe_webhook::{Event, EventObject, Webhook};

/*
For one-off payments (eg. credits packs), we see this typical sequence of events:

  - charge.succeeded (EventId("evt_3S3gutEobp4xy4Tl15tGHk88"))           -- IGNORE
  - payment_intent.succeeded (EventId("evt_3S3gutEobp4xy4Tl1t19fp3Y"))   -- Billing success signal
  - payment_intent.created (EventId("evt_3S3gutEobp4xy4Tl1mg80Zgu"))     -- IGNORE
  - checkout.session.completed (EventId("evt_1S3guvEobp4xy4TlxY7TVlUs")) -- Can use, but `payment_intent.succeeded` is better
  - charge.updated (EventId("evt_3S3gutEobp4xy4Tl1RgfG4NL"))             -- IGNORE
*/


#[derive(Serialize)]
pub struct StripeArtcraftWebhookSuccessResponse {
  pub success: bool,
}

// /// Stripe (Artcraft) Webhook Handler
// #[utoipa::path(
//   post,
//   tag = "Stripe (Artcraft)",
//   path = "/v1/stripe_artcraft/webhook",
//   responses(
//     (status = 200, description = "Success", body = StripeArtcraftWebhookSuccessResponse),
//   ),
//   params()
// )]
pub async fn stripe_artcraft_webhook_handler(
  http_request: HttpRequest,
  server_environment: Data<ServerEnvironment>,
  stripe_config: Data<ArtcraftStripeConfigWithClient>,
  request_body_bytes: Bytes,
  mysql_pool: Data<MySqlPool>,
) -> Result<Json<StripeArtcraftWebhookSuccessResponse>, StripeArtcraftWebhookError>
{
  verify_stripe_webhook_ip_address(&http_request, **server_environment)
      .map_err(|e| {
        let reason = format!("Improper client IP address. Error: {:?}", e);
        error!("{}", &reason);
        StripeArtcraftWebhookError::BadRequest(reason)
      })?;

  let secret_signing_key = &stripe_config.secret_webhook_signing_key;

  let stripe_signature = get_request_header_optional(&http_request, "Stripe-Signature")
      .unwrap_or_default();

  // NB: Treat the request payload as unstructured and defer to Stripe libraries.
  let webhook_payload = String::from_utf8(request_body_bytes.to_vec())
      .map_err(|err| {
        let reason = format!("Could not decode request body to UTF-8: {:?}", err);
        error!("{}", &reason);
        StripeArtcraftWebhookError::BadRequest(reason)
      })?;

  let webhook_payload = Webhook::construct_event(&webhook_payload, &stripe_signature, secret_signing_key)
      .map_err(|e| {
        let reason = format!("Could not construct Stripe webhook event: {:?}", e);
        error!("{}", &reason);
        println!("{:?}", webhook_payload);
        StripeArtcraftWebhookError::BadRequest(reason)
      })?;

  // Events can be re-sent, so we need to make handling them idempotent.
  let stripe_event_id = webhook_payload.id.to_string();
  let stripe_event_type = webhook_payload.type_.as_str().to_string();
  let stripe_event_created_at = NaiveDateTime::from_timestamp(webhook_payload.created, 0);
  let stripe_is_production = webhook_payload.livemode; // NB: Whether this was 'test' data or live data

  let stripe_event_descriptor = StripeEventDescriptor {
    stripe_event_id: stripe_event_id.clone(),
    stripe_event_type: stripe_event_type.clone(),
  };

  info!("Stripe webhook event type: {} ; is production: {}, created at: {}, pending events to be handled: {}",
    &stripe_event_descriptor,
    stripe_is_production,
    &stripe_event_created_at,
    webhook_payload.pending_webhooks);

  let mut mysql_connection = mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Could not acquire mysql connection: {:?}", err);
        StripeArtcraftWebhookError::ServerError("database error".to_string())
      })?;

  let maybe_previously_played_event = get_stripe_webhook_event_log_by_id_with_connection(&stripe_event_id, &mut mysql_connection)
      .await
      .map_err(|err| {
        error!("Could not query previous event by ID ({}): {:?}", &stripe_event_descriptor, err);
        StripeArtcraftWebhookError::ServerError("database error".to_string())
      })?;

  // TODO: This might be extraneous. Inserting logs is transactionally unique and can only happen once.
  if let Some(event) = maybe_previously_played_event {
    // The event is being replayed by Stripe, and we've already handled it.
    // We'll ignore it so that we remain idempotent.
    if event.should_ignore_retry {
      warn!("Stripe is replaying event ID={} ; ignoring it since we have already previously handled it.",
        &stripe_event_descriptor);

      return Ok(Json(StripeArtcraftWebhookSuccessResponse {
        success: true,
      }));
    }
  }

  let enriched_event = handle_webhook_event_enrichment(
    &stripe_event_descriptor,
    &stripe_config.client,
    **server_environment,
    webhook_payload,
  ).await?;

  let mut transaction = mysql_connection.begin().await?;

  let result = process_enriched_event(
    **server_environment, 
    &stripe_config,
    enriched_event,
    stripe_event_descriptor.clone(),
    stripe_event_id.clone(), 
    stripe_event_created_at, 
    stripe_event_type.clone(), 
    stripe_is_production, 
    &mut transaction
  ).await;

  match result {
    Ok(()) => {
      transaction.commit().await?;
    },
    Err(err) => {
      error!("Error handling Stripe webhook event {} : {:?}", 
        stripe_event_descriptor, 
        err);

      transaction.rollback().await?;

      return Err(err.into());
    }
  }

  Ok(Json(StripeArtcraftWebhookSuccessResponse {
    success: true,
  }))
}

async fn process_enriched_event(
  server_environment: ServerEnvironment, 
  stripe_config: &ArtcraftStripeConfigWithClient, 
  artcraft_event: EnrichedWebhookEvent,
  stripe_event_descriptor: StripeEventDescriptor,
  stripe_event_id: String, 
  stripe_event_created_at: NaiveDateTime, 
  stripe_event_type: String, 
  stripe_is_production: bool, 
  transaction: &mut Transaction<'_, MySql>
) -> Result<(), StripeArtcraftWebhookError> {

  if let Some(billing_action) = &artcraft_event.maybe_billing_action {
    info!("Billing action being taken for event : {}", &stripe_event_descriptor);
    // This is where we fulfill the purchase, subscription, non-payment, etc.!
    // TODO: Maybe grab the primary key of the impacted entity?
    transactionally_fulfill_artcraft_billing_action(
      billing_action,
      transaction,
    ).await?;
  } else {
    info!("No billing action to take for event : {}", &stripe_event_descriptor);
  }

  // NB: These records are uniquely keyed by ID, so this only happens once.
  let query = InsertStripeWebhookEventLog {
    stripe_event_id,
    stripe_event_type,
    maybe_stripe_event_entity_id: artcraft_event.webhook_event_log_summary.maybe_event_entity_id,
    maybe_stripe_customer_id: artcraft_event.webhook_event_log_summary.maybe_stripe_customer_id,
    stripe_event_created_at,
    stripe_is_production,
    maybe_user_token: artcraft_event.webhook_event_log_summary.maybe_user_token.map(|t| t.to_string()),
    action_was_taken: artcraft_event.webhook_event_log_summary.action_was_taken,
    should_ignore_retry: artcraft_event.webhook_event_log_summary.should_ignore_retry,
  };

  query.insert_transactional(transaction)
      .await
      .map_err(|err| {
        let reason = format!("Could not insert Stripe webhook event log: {:?}", err);
        error!("{}", &reason);
        StripeArtcraftWebhookError::ServerError("database error".to_string())
      })?;

  Ok(())
}
