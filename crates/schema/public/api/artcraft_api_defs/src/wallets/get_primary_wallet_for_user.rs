use enums::common::payments_namespace::PaymentsNamespace;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::wallets::WalletToken;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GetPrimaryWalletForUserResponse {
  pub success: bool,

  /// The primary wallet, if it exists.
  pub maybe_primary_wallet: Option<WalletDetails>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct WalletDetails {
  pub token: WalletToken,
  pub namespace: PaymentsNamespace,
  pub banked_credits: u64,
  pub monthly_credits: u64,
}
