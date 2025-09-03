use anyhow::anyhow;
use chrono::{DateTime, Utc};
use errors::AnyhowResult;
use reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, MySqlPool};

use crate::helpers::boolean_converters::nullable_i8_to_optional_bool;

pub struct UserSubscription {
  pub token: String,
  pub user_token: String,
  pub subscription_namespace: String,
  pub subscription_product_slug: String,
  pub maybe_stripe_subscription_id: Option<String>,
  pub maybe_stripe_product_id: Option<String>,
  pub maybe_stripe_customer_id: Option<String>,
  pub maybe_stripe_subscription_status: Option<StripeSubscriptionStatus>,
  pub maybe_stripe_is_production: Option<bool>,

  // Timestamps for the record updates, NOT stripe !!!
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // Stripe timestamps (which also control subscription status)
  pub subscription_start_at: DateTime<Utc>,
  pub subscription_expires_at: DateTime<Utc>,
}

pub async fn get_user_subscription_by_stripe_subscription_id(
  stripe_subscription_id: &str,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<UserSubscription>> {
  let mut mysql_connection = mysql_pool.acquire().await?;
  get_user_subscription_by_stripe_subscription_id_with_connection(
    stripe_subscription_id,
    &mut mysql_connection
  ).await
}

pub async fn get_user_subscription_by_stripe_subscription_id_with_connection(
  stripe_subscription_id: &str,
  mysql_connection: &mut PoolConnection<MySql>
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
      .fetch_one(&mut **mysql_connection)
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

struct RawUserSubscriptionFromDb {
  pub token: String,
  pub user_token: String,
  pub subscription_namespace: String,
  pub subscription_product_slug: String,
  pub maybe_stripe_subscription_id: Option<String>,
  pub maybe_stripe_product_id: Option<String>,
  pub maybe_stripe_customer_id: Option<String>,
  pub maybe_stripe_subscription_status: Option<StripeSubscriptionStatus>,
  pub maybe_stripe_is_production: Option<i8>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub subscription_start_at: DateTime<Utc>,
  pub subscription_expires_at: DateTime<Utc>,
}
