use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::configs::subscriptions::get_artcraft_subscription_by_slug_and_env::get_artcraft_subscription_by_slug_and_env;
use crate::endpoints::checkout_with_user_signup::user_creation_case::user_creation_case;
use crate::endpoints::checkout_with_user_signup::user_exists_case::user_exists_case;
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use actix_web::web::{Data, Json};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::stripe_artcraft::create_create_new_user_account_and_subscription_checkout::{PlanBillingCadence, StripeArtcraftCreateSubscriptionCheckoutWithUserSignupRequest, StripeArtcraftCreateSubscriptionCheckoutWithUserSignupResponse};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use enums::common::payments_namespace::PaymentsNamespace;
use log::{error, info, warn};
use mysql_queries::queries::users::user_stripe_customer_links::find_user_stripe_customer_link::find_user_stripe_customer_link_using_connection;
use mysql_queries::queries::users::user_subscriptions::find_possibly_inactive_first_subscription_for_owner_user::find_possibly_inactive_first_subscription_for_owner_user_using_connection;
use mysql_queries::queries::users::user_subscriptions::find_subscription_for_owner_user::find_subscription_for_owner_user_using_connection;
use reusable_types::server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use stripe_checkout::checkout_session::{CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionLineItems, CreateCheckoutSessionSavedPaymentMethodOptions, CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters, CreateCheckoutSessionSavedPaymentMethodOptionsPaymentMethodSave, CreateCheckoutSessionSubscriptionData};
use stripe_checkout::CheckoutSessionMode;
use stripe_core::CustomerId;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;
// /// Create a new user account and Stripe Checkout session and return the redirect URL in Json.
// #[utoipa::path(
//   get,
//   tag = "Stripe (Artcraft)",
//   path = "/v1/stripe_artcraft/user_signup/subscription_checkout",
//   params(
//     ("request" = CreateCheckoutSessionRequest, description = "Payload for Request"),
//   ),
//   responses(
//     (status = 200, description = "Success Delete", body = CreateCheckoutSessionSuccessResponse),
//   ),
// )]

/// Create a Stripe Checkout session *with* user signup and return the redirect URL in Json.
/// If the user is already logged in, we just attach it to that record instead.
pub async fn stripe_artcraft_create_checkout_with_user_signup_handler(
  http_request: HttpRequest,
  request: Json<StripeArtcraftCreateSubscriptionCheckoutWithUserSignupRequest>,
  stripe_config: Data<ArtcraftStripeConfigWithClient>,
  server_environment: Data<ServerEnvironment>,
  internal_user_lookup: Data<dyn InternalUserLookup>,
  internal_session_cache_purge: Data<dyn InternalSessionCachePurge>,
  mysql_pool: Data<MySqlPool>,
) -> Result<Json<StripeArtcraftCreateSubscriptionCheckoutWithUserSignupResponse>, CommonWebError>
{
  let slug = match request.plan {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no plan supplied".to_string())),
    Some(slug) => slug,
  };

  let cadence = match request.cadence {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no cadence supplied".to_string())),
    Some(cadence) => cadence,
  };

  let plan = get_artcraft_subscription_by_slug_and_env(slug, **server_environment);

  let mut mysql_connection = mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Could not acquire mysql connection: {:?}", err);
        CommonWebError::ServerError
      })?;

  let price_id = match cadence {
    PlanBillingCadence::Monthly => plan.monthly_price_id.clone(),
    PlanBillingCadence::Yearly => plan.yearly_price_id.clone(),
  };

  let maybe_user_metadata = internal_user_lookup
      .lookup_user_from_http_request_and_mysql_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|err| {
        error!("Error looking up user: {:?}", err);
        CommonWebError::ServerError // NB: This was probably *our* fault.
      })?;

  let checkout_session = match maybe_user_metadata {
    None => {
      info!("Creating new user, then creating checkout session...");
      user_creation_case(
        &price_id,
        &mut mysql_connection,
        &stripe_config,
      ).await?
    },
    Some(user_metadata) => {
      info!("Creating checkout session for user: {:?}", user_metadata.user_token_typed);
      user_exists_case(
        &price_id,
        &user_metadata,
        &mut mysql_connection,
        &stripe_config,
      ).await?
    },
  };

  let url = checkout_session.url.ok_or(CommonWebError::ServerError)?;

  // Best effort to delete Redis session cache
  internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  Ok(Json(StripeArtcraftCreateSubscriptionCheckoutWithUserSignupResponse {
    success: true,
    stripe_checkout_redirect_url: url,
    generated_user: None,
    session: None,
  }))
}
