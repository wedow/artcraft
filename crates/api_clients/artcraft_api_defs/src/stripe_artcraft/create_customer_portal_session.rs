use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const CREATE_CUSTOMER_PORTAL_URL_PATH: &str = "/v1/stripe_artcraft/portal/create_session";

/// See https://docs.stripe.com/customer-management/portal-deep-links
#[derive(Serialize, Deserialize, ToSchema, Copy, Clone, Debug)]
pub enum StripeArtcraftCreateCustomerPortalFlowState {
  // subscription_update
  SubscriptionUpdate,

  // subscription_cancel
  SubscriptionCancel,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateCustomerPortalSessionRequest {
  // TODO: Not sure if this is needed
  pub portal_config_id: Option<String>,

  /// An optional deep link into the customer portal
  /// This sets the initial state of the portal
  pub flow: Option<StripeArtcraftCreateCustomerPortalFlowState>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateCustomerPortalSessionResponse {
  pub success: bool,
  pub stripe_portal_url: String,
}

