use crate::configs::get_artcraft_product_by_slug::get_artcraft_product_by_slug;
use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use actix_web::web::{Data, Json};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{PlanBillingCadence, StripeArtcraftCreateCheckoutSessionRequest, StripeArtcraftCreateCheckoutSessionResponse};
//use billing_component::stripe::traits::internal_user_lookup::InternalUserLookup;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use log::{error, warn};
use reusable_types::server_environment::ServerEnvironment;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use stripe_checkout::checkout_session::{CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionLineItems, CreateCheckoutSessionSubscriptionData};
use stripe_checkout::CheckoutSessionMode;
use stripe_core::CustomerId;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;

//use utoipa::ToSchema;

// /// Create a Stripe Checkout session and return the redirect URL in Json.
// #[utoipa::path(
//   get,
//   tag = "Stripe (Artcraft)",
//   path = "/v1/stripe_artcraft/checkout/create_subscription",
//   params(
//     ("request" = CreateCheckoutSessionRequest, description = "Payload for Request"),
//   ),
//   responses(
//     (status = 200, description = "Success Delete", body = CreateCheckoutSessionSuccessResponse),
//   ),
// )]
pub async fn stripe_artcraft_create_checkout_session_handler(
  http_request: HttpRequest,
  request: Json<StripeArtcraftCreateCheckoutSessionRequest>,
  //server_state: Data<Arc<ServerState>>,
  stripe_config: Data<ArtcraftStripeConfigWithClient>,
  server_environment: Data<ServerEnvironment>,
  //internal_user_lookup: Data<dyn InternalUserLookup>,
  internal_session_cache_purge: Data<dyn InternalSessionCachePurge>,
) -> Result<Json<StripeArtcraftCreateCheckoutSessionResponse>, CommonWebError>
{
  let slug = match request.plan {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no plan supplied".to_string())),
    Some(slug) => slug,
  };

  let cadence = match request.cadence {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no cadence supplied".to_string())),
    Some(cadence) => cadence,
  };

  let plan = get_artcraft_product_by_slug(slug, **server_environment);

  let price_id = match cadence {
    PlanBillingCadence::Monthly => plan.monthly_price_id.clone(),
    PlanBillingCadence::Yearly => plan.yearly_price_id.clone(),
  };

  //let maybe_user_metadata = internal_user_lookup
  //    .lookup_user_from_http_request(&http_request)
  //    .await
  //    .map_err(|err| {
  //      error!("Error looking up user: {:?}", err);
  //      CommonWebError::ServerError // NB: This was probably *our* fault.
  //    })?;

  //// NB: Our integration relies on an internal user token being present.
  //let user_metadata = match maybe_user_metadata {
  //  None => return Err(CommonWebError::NotAuthorized),
  //  Some(user_metadata) => user_metadata,
  //};

  //error!("Subscriptions: {:?}", &user_metadata.existing_subscription_keys);

  //// TODO: This will not handle a future where we have multiple "namespaces" or can offer users more than one subscription.
  ////  It will actively block users from subscribing to two or more websites.
  //if !user_metadata.existing_subscription_keys.is_empty() {
  //  return Err(CommonWebError::BadInputWithSimpleMessage("user already has plan".to_string()))
  //}

  let success_url = stripe_config.checkout_success_url.clone();
  let cancel_url = stripe_config.checkout_cancel_url.clone();

  let checkout_session = {
    let mut params = CreateCheckoutSession::new();

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

    //metadata.insert(STRIPE_ARTCRAFT_METADATA_USER_TOKEN.to_string(), user_metadata.user_token.to_string());

    //if let Some(username) = user_metadata.username.as_deref() {
    //  metadata.insert(STRIPE_ARTCRAFT_METADATA_USERNAME.to_string(), username.to_string());
    //}

    //if let Some(user_email) = user_metadata.user_email.as_deref() {
    //  metadata.insert(STRIPE_ARTCRAFT_METADATA_EMAIL.to_string(), user_email.to_string());
    //}

    // NB: This metadata attaches to Stripe's Checkout Session object.
    // This does not attach to the subscription or payment intent, which have their own metadata
    // objects. (TODO: Confirm this.)
    //let mut params = params.metadata(metadata.clone());

    // Subscription mode: Use Stripe Billing to set up fixed-price subscriptions.
    // TODO: params.mode = Some(CheckoutSessionMode::Subscription);

    // NB: This metadata attaches to the subscription entity itself.
    // This cannot be used for non-subscription, one-off payments.
    // https://support.stripe.com/questions/using-metadata-with-checkout-sessions
    let mut params = params.subscription_data(CreateCheckoutSessionSubscriptionData {
      metadata: Some(metadata),
      ..Default::default()
    });

    // If we already have a Stripe customer associated with the user account, we'll reuse it.
    //if let Some(existing_stripe_customer_id) = user_metadata.maybe_existing_stripe_customer_id.as_deref() {
    //  match CustomerId::from_str(existing_stripe_customer_id) {
    //    Ok(customer_id) => {
    //      params = params.customer(customer_id);
    //    }
    //    Err(err) => {
    //      // NB: Don't block checkout.
    //      warn!("Error parsing user's ({}) supposed existing stripe customer id: {:?}",
    //        &user_metadata.user_token,
    //        err);
    //    }
    //  }
    //}

    // TODO: THis is now broken
    //CheckoutSession::create(&server_state.stripe_artcraft.client, params)
    //    .await
    //    .map_err(|e| {
    //      error!("Stripe Error: {:?}", e);
    //      CommonWebError::ServerError
    //    })?

    let checkout_builder = CreateCheckoutSession::new()
        .success_url(&success_url)
        .cancel_url(&cancel_url)
        .mode(CheckoutSessionMode::Subscription)
        .line_items(vec![
          CreateCheckoutSessionLineItems {
            price: Some(price_id.to_string()),
            quantity: Some(1),
            ..Default::default()
          }
        ])
        .automatic_tax(CreateCheckoutSessionAutomaticTax {
          enabled: true,
          liability: None,
        })
        //.customer(customer.id.as_str())
        //.expand([String::from("line_items"), String::from("line_items.data.price.product")])
        ;

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
  internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  Ok(Json(StripeArtcraftCreateCheckoutSessionResponse {
    success: true,
    stripe_checkout_redirect_url: url,
  }))
}
