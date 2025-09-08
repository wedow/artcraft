use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub enum ArtcraftBillingAction {
  /// An ignorable event.
  IgnorableEvent,
  
  /// A user purchased wallet credits.
  WalletCreditsPurchase(WalletCreditsPurchaseEvent),
  
  // TODO:
  SubscriptionCreated,
  SubscriptionRenewalBillingFailed,
  SubscriptionRenewalBillingSucceeded,
  SubscriptionCanceled,
}

pub struct WalletCreditsPurchaseEvent {
  pub owner_user_token: UserToken,
  
  // We might have sent the wallet to stripe. 
  // If not, we'll need to look it up or create one.
  pub maybe_wallet_token: Option<WalletToken>,
  
  pub pack: StripeArtcraftCreditsPackInfo,
  
  // NB: This is a multiplier on the pack's base value.
  pub quantity: u64,
}

