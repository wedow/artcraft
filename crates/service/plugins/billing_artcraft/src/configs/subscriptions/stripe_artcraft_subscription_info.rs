use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;

#[derive(Debug, Clone)]
pub struct StripeArtcraftSubscriptionInfo {
  pub slug: ArtcraftSubscriptionSlug,
  pub product_id: &'static str,
  pub monthly_price_id: &'static str,
  pub yearly_price_id: &'static str,
}

