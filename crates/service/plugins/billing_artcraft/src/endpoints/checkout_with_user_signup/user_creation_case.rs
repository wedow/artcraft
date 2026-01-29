use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use stripe_shared::CheckoutSession;

pub (super) async fn user_creation_case(
  price_id: &str,
  mysql_connection: &mut PoolConnection<MySql>,
  stripe_config: &ArtcraftStripeConfigWithClient,
) -> Result<CheckoutSession, CommonWebError> {
  Ok(())
}
