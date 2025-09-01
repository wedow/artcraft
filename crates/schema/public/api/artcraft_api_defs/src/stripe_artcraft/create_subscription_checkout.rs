use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const CREATE_SUBSCRIPTION_CHECKOUT_URL_PATH: &str = "/v1/stripe_artcraft/checkout/create_subscription";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateCheckoutSessionRequest {
  /// The (non-Stripe) internal identifier for the product or subscription.
  /// This will be translated into a Stripe identifier.
  pub plan: Option<PlanName>,

  pub cadence: Option<PlanBillingCadence>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Copy, Clone)]
pub enum PlanName {
  #[serde(rename = "basic")]
  Basic,
  #[serde(rename = "pro")]
  Pro,
  #[serde(rename = "max")]
  Max,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Copy, Clone)]
pub enum PlanBillingCadence {
  #[serde(rename = "monthly")]
  Monthly,

  #[serde(rename = "yearly")]
  Yearly,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateCheckoutSessionResponse {
  pub success: bool,
  pub stripe_checkout_redirect_url: String,
}

