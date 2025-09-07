use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;

#[derive(Debug, Clone)]
pub struct StripeArtcraftCreditsPackInfo {
  pub slug: ArtcraftCreditsPackSlug,
  pub product_id: &'static str,
  pub price_id: &'static str,
  pub purchase_credits_amount: u64,
}

