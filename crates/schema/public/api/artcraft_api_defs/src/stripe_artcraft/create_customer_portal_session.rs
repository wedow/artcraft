use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const CREATE_CUSTOMER_PORTAL_URL_PATH: &str = "/v1/stripe_artcraft/portal/create_session";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateCustomerPortalSessionRequest {
  // TODO: Not sure if this is needed
  pub portal_config_id: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateCustomerPortalSessionResponse {
  pub success: bool,
  pub stripe_portal_url: String,
}

