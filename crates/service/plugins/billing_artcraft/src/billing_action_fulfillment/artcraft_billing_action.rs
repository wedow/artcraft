use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use crate::configs::subscriptions::stripe_artcraft_subscription_info::StripeArtcraftSubscriptionInfo;
use chrono::NaiveDateTime;
use reusable_types::stripe::stripe_recurring_interval::StripeRecurringInterval;
use reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub enum ArtcraftBillingAction {
  /// An ignorable event.
  IgnorableEvent,
  
  /// A user purchased wallet credits.
  WalletCreditsPurchase(WalletCreditsPurchaseEvent),
  
  SubscriptionCreated(UpsertableSubscriptionDetails),
  SubscriptionUpdated(UpsertableSubscriptionDetails),
  
  // TODO
  SubscriptionDeleted,

  // TODO:
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


pub struct UpsertableSubscriptionDetails {
  /// Stripe's subscription_id is a unique foreign key  in the 
  /// `users_subscriptions` table!
  pub stripe_subscription_id: String,

  // Other stripe foreign keys ... 
  
  pub stripe_customer_id: String,
  pub stripe_product_id: String,
  pub stripe_price_id: String,

  /// Artcraft subscription product
  pub subscription: StripeArtcraftSubscriptionInfo,
  
  /// Artcraft user
  pub owner_user_token: UserToken,

  /// The state of the subscription: active, cancelled, and other states.
  pub stripe_subscription_status: StripeSubscriptionStatus,

  pub stripe_recurring_interval : StripeRecurringInterval,
  
  pub stripe_is_production: bool,

  /// When the subscription was "created" in Stripe (including any backdating)
  pub subscription_start_at: NaiveDateTime,

  // The updated billing period for the subscription
  pub current_billing_period_start_at: NaiveDateTime,
  pub current_billing_period_end_at: NaiveDateTime,

  /// When the subscription is set to expire.
  /// TODO: - maybe not - This controls whether it is active or not.
  pub calculated_subscription_expires_at: NaiveDateTime,

  // Subscription cancellation (future and past)
  /// TODO: - maybe not - This controls whether it is active or not.
  pub maybe_cancel_at: Option<NaiveDateTime>,
  pub maybe_canceled_at: Option<NaiveDateTime>,
}
