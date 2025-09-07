use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;

/// Record the credits pack purchase
pub async fn establish_wallet(
  pack: &StripeArtcraftCreditsPackInfo,
  quantity: u64,
) -> anyhow::Result<()> {

  // TODO: Math + transaction

  Ok(())
}
