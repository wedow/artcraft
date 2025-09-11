use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallets::WalletToken;

pub struct WalletUpdateSummary {
  pub token: WalletToken,

  pub namespace: PaymentsNamespace,

  pub owner_user_token: UserToken,

  pub banked_credits_now: u64,
  pub monthly_credits_now: u64,

  pub banked_credits_before: u64,
  pub monthly_credits_before: u64,
}
