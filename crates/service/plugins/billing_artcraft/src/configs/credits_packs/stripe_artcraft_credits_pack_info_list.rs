use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;

//
// SANDBOX
//

pub const ARTCRAFT_1000_SANDBOX : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft1000,
  product_id: "",
  price_id: "",
};

pub const ARTCRAFT_2500_SANDBOX : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft2500,
  product_id: "",
  price_id: "",
};

//
// PRODUCTION
//

pub const ARTCRAFT_1000_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft1000,
  product_id: "FIXME_1",
  price_id: "FIXME_2",
};

pub const ARTCRAFT_2500_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft2500,
  product_id: "FIXME_3",
  price_id: "FIXME_4",
};
