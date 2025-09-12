use enums::common::payments_namespace::PaymentsNamespace;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::user_subscriptions::UserSubscriptionToken;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GetSessionSubscriptionResponse {
  pub success: bool,

  /// Information about the user's subscription, if any.
  pub active_subscription: Option<SubscriptionInfo>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct SubscriptionInfo {
  /// Unique token for the subscription.
  pub subscription_token: UserSubscriptionToken,

  /// Namespace for the subscription.
  pub namespace: PaymentsNamespace,

  /// Local key for the subscription.
  pub product_slug: String,
}
