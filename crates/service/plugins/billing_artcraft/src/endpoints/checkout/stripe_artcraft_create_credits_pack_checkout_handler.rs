use crate::configs::credits_packs::get_artcraft_credits_pack_by_slug_and_env::get_artcraft_credits_pack_by_slug_and_env;
use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::configs::subscriptions::get_artcraft_subscription_by_slug_and_env::get_artcraft_subscription_by_slug_and_env;
use crate::endpoints::webhook::common::stripe_artcraft_webhook_error::StripeArtcraftWebhookError;
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use actix_web::web::{Data, Json};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::stripe_artcraft::create_credits_pack_checkout::{StripeArtcraftCreateCreditsPackCheckoutRequest, StripeArtcraftCreateCreditsPackCheckoutResponse};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{PlanBillingCadence, StripeArtcraftCreateSubscriptionCheckoutRequest, StripeArtcraftCreateSubscriptionCheckoutResponse};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use enums::common::payments_namespace::PaymentsNamespace;
use log::{error, info, warn};
use mysql_queries::queries::users::user_subscriptions::find_subscription_for_owner_user::find_subscription_for_owner_user_using_connection;
use reusable_types::server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use stripe_checkout::checkout_session::{CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionLineItems, CreateCheckoutSessionLineItemsAdjustableQuantity, CreateCheckoutSessionPaymentIntentData, CreateCheckoutSessionSubscriptionData};
use stripe_checkout::CheckoutSessionMode;
use stripe_core::CustomerId;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;
//use utoipa::ToSchema;

// /// Create a Stripe Checkout session and return the redirect URL in Json.
// #[utoipa::path(
//   get,
//   tag = "Stripe (Artcraft)",
//   path = "/v1/stripe_artcraft/checkout/credits_pack",
//   params(
//     ("request" = CreateCheckoutSessionRequest, description = "Payload for Request"),
//   ),
//   responses(
//     (status = 200, description = "Success Delete", body = CreateCheckoutSessionSuccessResponse),
//   ),
// )]
pub async fn stripe_artcraft_create_credits_pack_checkout_handler(
  http_request: HttpRequest,
  request: Json<StripeArtcraftCreateCreditsPackCheckoutRequest>,
  stripe_config: Data<ArtcraftStripeConfigWithClient>,
  server_environment: Data<ServerEnvironment>,
  internal_user_lookup: Data<dyn InternalUserLookup>,
  internal_session_cache_purge: Data<dyn InternalSessionCachePurge>,
  mysql_pool: Data<MySqlPool>,
) -> Result<Json<StripeArtcraftCreateCreditsPackCheckoutResponse>, CommonWebError>
{
  let slug = match request.credits_pack {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no credits pack supplied".to_string())),
    Some(slug) => slug,
  };

  let credits_pack = get_artcraft_credits_pack_by_slug_and_env(slug, **server_environment);

  let mut mysql_connection = mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Could not acquire mysql connection: {:?}", err);
        CommonWebError::ServerError
      })?;

  let maybe_user_metadata = internal_user_lookup
      .lookup_user_from_http_request_and_mysql_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|err| {
        error!("Error looking up user: {:?}", err);
        CommonWebError::ServerError // NB: This was probably *our* fault.
      })?;

  // NB: Our integration relies on an internal user token being present.
  let user_metadata = match maybe_user_metadata {
    None => return Err(CommonWebError::NotAuthorized),
    Some(user_metadata) => user_metadata,
  };

  // NB: Currently the stripe customer id field in the `users` table is only for FakeYou subscriptions,
  // so we need to look up any existing Artcraft subscription separately. This is needed to pre-fill
  // the Stripe billing form.
  let maybe_subscription = find_subscription_for_owner_user_using_connection(
    &user_metadata.user_token_typed,
    PaymentsNamespace::Artcraft,
    &mut mysql_connection
  ).await.map_err(|err| {
    error!("Error looking up user's ({}) existing subscription: {:?}", &user_metadata.user_token_typed, err);
    CommonWebError::ServerError // NB: This was probably *our* fault.
  })?;
  
  let maybe_existing_stripe_customer_id = maybe_subscription.as_ref()
      .map(|sub| sub.stripe_customer_id.as_str());

  let success_url = stripe_config.checkout_success_url.clone();
  let cancel_url = stripe_config.checkout_cancel_url.clone();

  let checkout_session = {
    // `client_reference_id`
    // Stripe Docs:
    //   A unique string to reference the Checkout Session.
    //   This can be a customer ID, a cart ID, or similar, and can be used to reconcile the session
    //   with your internal systems.
    //
    // Our Notes:
    //   This gets reported back in the Checkout Session (and related webhooks) as
    //   `client_reference_id`. Passing the same ID on multiple checkouts does not unify or
    //   cross-correlate customers and only seems to be metadata for the checkout session itself.
    //   This is probably only useful for tracking checkout session engagement.
    //params.client_reference_id = Some("SOME_INTERNAL_ID");

    // `customer_email`
    // Stripe Docs:
    //   If provided, this value will be used when the Customer object is created. If not provided,
    //   customers will be asked to enter their email address. Use this parameter to prefill
    //   customer data if you already have an email on file. To access information about the
    //   customer once a session is complete, use the customer field.
    //
    // Our Notes:
    //   This does not look up previous customers with the same email and will not unify or
    //   cross-correlate customers. By default the field will be un-editable in the checkout flow
    //   if this is specified.
    //params.customer_email = Some("email@example.com");

    let mut metadata = HashMap::new();

    metadata.insert(STRIPE_ARTCRAFT_METADATA_USER_TOKEN.to_string(), user_metadata.user_token.to_string());

    if let Some(username) = user_metadata.username.as_deref() {
      metadata.insert(STRIPE_ARTCRAFT_METADATA_USERNAME.to_string(), username.to_string());
    }

    if let Some(user_email) = user_metadata.user_email.as_deref() {
      metadata.insert(STRIPE_ARTCRAFT_METADATA_EMAIL.to_string(), user_email.to_string());
    }

    let mut checkout_builder = CreateCheckoutSession::new()
        .success_url(&success_url)
        .cancel_url(&cancel_url)
        .mode(CheckoutSessionMode::Payment)
        .line_items(vec![
          CreateCheckoutSessionLineItems {
            price: Some(credits_pack.price_id.to_string()),
            quantity: Some(1),
            adjustable_quantity: Some(
              CreateCheckoutSessionLineItemsAdjustableQuantity {
                enabled: true,
                minimum: Some(1),
                maximum: Some(100),
              }
            ),
            ..Default::default()
          }
        ])
        .allow_promotion_codes(true)
        .automatic_tax(CreateCheckoutSessionAutomaticTax {
          enabled: true,
          liability: None,
        })
        .metadata(metadata.clone())
        .payment_intent_data(CreateCheckoutSessionPaymentIntentData {
          metadata: Some(metadata),
          ..Default::default()
        });

    if let Some(existing_stripe_customer_id) = maybe_existing_stripe_customer_id{
      info!("Adding existing stripe customer id to checkout session: {}", existing_stripe_customer_id);
      match CustomerId::from_str(existing_stripe_customer_id) {
        Ok(customer_id) => {
          checkout_builder = checkout_builder.customer(customer_id);
        }
        Err(err) => {
          // NB: Don't block checkout.
          warn!("Error parsing user's ({}) supposed existing stripe customer id: {:?}",
            &user_metadata.user_token,
            err);
        }
      }
    }

    let checkout_session = checkout_builder
        .send(&stripe_config.client)
        .await
        .map_err(|err| {
          error!("Stripe Error: {:?}", err);
          CommonWebError::ServerError
        })?;

    checkout_session
  };

  let url = checkout_session.url.ok_or(CommonWebError::ServerError)?;

  // Best effort to delete Redis session cache
  // internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  Ok(Json(StripeArtcraftCreateCreditsPackCheckoutResponse{
    success: true,
    stripe_checkout_redirect_url: url,
  }))
}
