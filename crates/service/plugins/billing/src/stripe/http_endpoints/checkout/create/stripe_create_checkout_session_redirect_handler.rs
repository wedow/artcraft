use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::http::header;
use actix_web::web::Query;

use reusable_types::server_environment::ServerEnvironment;
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;

use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_error::CreateCheckoutSessionError;
use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_shared::stripe_create_checkout_session_shared;
use crate::stripe::stripe_config::StripeConfig;
use crate::stripe::traits::internal_product_to_stripe_lookup::InternalProductToStripeLookup;
use crate::stripe::traits::internal_user_lookup::InternalUserLookup;

// =============== Request ===============

#[derive(Deserialize)]
pub struct CreateCheckoutSessionRequest {
  product: Option<String>,
}

pub async fn stripe_create_checkout_session_redirect_handler(
  http_request: HttpRequest,
  request: Query<CreateCheckoutSessionRequest>,
  stripe_config: web::Data<StripeConfig>,
  stripe_client: web::Data<stripe::Client>,
  server_environment: web::Data<ServerEnvironment>,
  url_redirector: web::Data<ThirdPartyUrlRedirector>,
  internal_product_to_stripe_lookup: web::Data<dyn InternalProductToStripeLookup>,
  internal_user_lookup: web::Data<dyn InternalUserLookup>,
  internal_session_cache_purge: web::Data<dyn InternalSessionCachePurge>,
) -> Result<HttpResponse, CreateCheckoutSessionError>
{
  let maybe_internal_product_key = request.product.as_deref();

  let url = stripe_create_checkout_session_shared(
    maybe_internal_product_key,
    &http_request,
    &stripe_config,
    server_environment.get_ref().clone(),
    &stripe_client,
    &url_redirector,
    internal_product_to_stripe_lookup.get_ref(),
    internal_user_lookup.get_ref(),
  ).await?;

  // Best effort to delete Redis session cache
  internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  Ok(HttpResponse::Found()
      .append_header((header::LOCATION, url))
      .finish())
}
