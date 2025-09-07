use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;

//
// SANDBOX
//

pub const ARTCRAFT_1000_SANDBOX : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft1000,
  product_id: "prod_Szg3Puzu8rDnjc",
  price_id: "price_1S3ghiEobp4xy4TlnQrm6UG4",
  purchase_credits_amount: 1000,
};

pub const ARTCRAFT_2500_SANDBOX : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft2500,
  product_id: "prod_Szg4dDUPQJNuO4",
  price_id: "price_1S3gi3Eobp4xy4TlkfG1qFkT",
  purchase_credits_amount: 2500,
};

//
// PRODUCTION
//

pub const ARTCRAFT_1000_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft1000,
  product_id: "prod_Szg0GS23FrVhQM",
  price_id: "price_1S3geBIaZEzwFveeg5GXWn1J",
  purchase_credits_amount: 1000,
};

pub const ARTCRAFT_2500_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft2500,
  product_id: "prod_Szg1VdYZdhGoS8",
  price_id: "price_1S3gf8IaZEzwFveen76Xc0kK",
  purchase_credits_amount: 2500,
};
