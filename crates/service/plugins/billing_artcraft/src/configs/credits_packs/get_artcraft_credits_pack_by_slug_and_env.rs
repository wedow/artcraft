use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use crate::configs::credits_packs::stripe_artcraft_credits_pack_info_list::{ARTCRAFT_1000_PRODUCTION, ARTCRAFT_1000_SANDBOX, ARTCRAFT_2500_PRODUCTION, ARTCRAFT_2500_SANDBOX};
use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;
use reusable_types::server_environment::ServerEnvironment;

pub fn get_artcraft_credits_pack_by_slug_and_env(slug: ArtcraftCreditsPackSlug, env: ServerEnvironment) -> StripeArtcraftCreditsPackInfo {
  match (env, slug) {
    // Development sandbox
    (ServerEnvironment::Development, ArtcraftCreditsPackSlug::Artcraft1000) => ARTCRAFT_1000_SANDBOX,
    (ServerEnvironment::Development, ArtcraftCreditsPackSlug::Artcraft2500) => ARTCRAFT_2500_SANDBOX,
    // Production
    (ServerEnvironment::Production, ArtcraftCreditsPackSlug::Artcraft1000) => ARTCRAFT_1000_PRODUCTION,
    (ServerEnvironment::Production, ArtcraftCreditsPackSlug::Artcraft2500) => ARTCRAFT_2500_PRODUCTION,
  }
}
