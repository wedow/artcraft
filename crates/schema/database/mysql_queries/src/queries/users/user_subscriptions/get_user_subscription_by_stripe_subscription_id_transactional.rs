use crate::helpers::boolean_converters::nullable_i8_to_optional_bool;
use crate::queries::users::user_subscriptions::get_user_subscription_by_stripe_subscription_id::{RawUserSubscriptionFromDb, UserSubscription};
use anyhow::anyhow;
use errors::AnyhowResult;
use sqlx::{MySql, Transaction};

pub async fn get_user_subscription_by_stripe_subscription_id_transactional(
  stripe_subscription_id: &str,
  transaction: &mut Transaction<'_, MySql>
) -> AnyhowResult<Option<UserSubscription>> {

  let maybe_user_record = sqlx::query_as!(
      RawUserSubscriptionFromDb,
        r#"
SELECT
  token,
  user_token,
  subscription_namespace,
  subscription_product_slug,
  maybe_stripe_subscription_id,
  maybe_stripe_customer_id,
  maybe_stripe_product_id,
  maybe_stripe_subscription_status as `maybe_stripe_subscription_status: reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus`,
  maybe_stripe_is_production,
  created_at,
  updated_at,
  subscription_start_at,
  subscription_expires_at
FROM user_subscriptions
WHERE
  maybe_stripe_subscription_id = ?
        "#,
        stripe_subscription_id,
    )
      .fetch_one(&mut **transaction)
      .await;

  match maybe_user_record {
    Err(sqlx::error::Error::RowNotFound) => Ok(None),
    Err(e) => {
      Err(anyhow!("mysql query error: {:?}", e))
    }
    Ok(r) => {
      Ok(Some(UserSubscription {
        token: r.token,
        user_token: r.user_token,
        subscription_namespace: r.subscription_namespace,
        subscription_product_slug: r.subscription_product_slug,
        maybe_stripe_subscription_id: r.maybe_stripe_subscription_id,
        maybe_stripe_product_id: r.maybe_stripe_product_id,
        maybe_stripe_customer_id: r.maybe_stripe_customer_id,
        maybe_stripe_subscription_status: r.maybe_stripe_subscription_status,
        maybe_stripe_is_production: nullable_i8_to_optional_bool(r.maybe_stripe_is_production),
        created_at: r.created_at,
        updated_at: r.updated_at,
        subscription_start_at: r.subscription_start_at,
        subscription_expires_at: r.subscription_expires_at,
      }))
    },
  }
}
