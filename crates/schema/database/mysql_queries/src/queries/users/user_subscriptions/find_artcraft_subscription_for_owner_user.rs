use crate::errors::select_optional_record_error::SelectOptionalRecordError;
use crate::helpers::boolean_converters::nullable_i8_to_bool_default_false;
use chrono::{DateTime, Utc};
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use enums::common::subscription_namespace::SubscriptionNamespace;
use sqlx;
use sqlx::mysql::{MySqlArguments, MySqlRow};
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::users::UserToken;

pub struct ArtcraftSubscription {
  pub user_token: UserToken,

  pub subscription_namespace: SubscriptionNamespace,
  pub subscription_product_slug: ArtcraftSubscriptionSlug,

  pub stripe_customer_id: String,
  pub stripe_subscription_id: String,
  pub stripe_subscription_status: String,
  pub stripe_invoice_is_paid: bool,

  /// When the subscription was created (Stripe's POV, not our db record),
  /// though even Stripe might have backdated it. It defaults to our DB record
  /// created timestamp until Stripe updates it.
  pub subscription_start_at: DateTime<Utc>,

  /// This is the authoritative timestamp for when the subscription expires.
  pub subscription_expires_at: DateTime<Utc>,
}

pub async fn find_artcraft_subscription_for_owner_user_using_connection(
  user_token: &UserToken,
  connection: &mut PoolConnection<MySql>,
) -> Result<Option<ArtcraftSubscription>, SelectOptionalRecordError> {

  let query = query(user_token);

  let result = query
      .fetch_optional(&mut **connection)
      .await;

  map_result(result)
}


pub async fn find_artcraft_subscription_for_owner_user_using_transaction(
  user_token: &UserToken,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<Option<ArtcraftSubscription>, SelectOptionalRecordError> {

  let query = query(user_token);

  let result = query
      .fetch_optional(&mut **transaction)
      .await;

  map_result(result)
}

fn map_result(result: Result<Option<RawArtcraftSubscription>, sqlx::Error>) -> Result<Option<ArtcraftSubscription>, SelectOptionalRecordError> {
  match result {
    Ok(Some(record)) => Ok(Some(ArtcraftSubscription {
      user_token: record.user_token,
      subscription_namespace: record.subscription_namespace,
      subscription_product_slug: record.subscription_product_slug,
      stripe_customer_id: record.maybe_stripe_customer_id
          .ok_or_else(|| SelectOptionalRecordError::RequiredFieldWasNull("maybe_stripe_customer_id"))?,
      stripe_subscription_id: record.maybe_stripe_subscription_id
          .ok_or_else(|| SelectOptionalRecordError::RequiredFieldWasNull("maybe_stripe_subscription_id"))?,
      stripe_subscription_status: record.maybe_stripe_subscription_status
          .ok_or_else(|| SelectOptionalRecordError::RequiredFieldWasNull("maybe_stripe_subscription_status"))?,
      stripe_invoice_is_paid: nullable_i8_to_bool_default_false(record.maybe_stripe_invoice_is_paid),
      subscription_start_at: record.subscription_start_at,
      subscription_expires_at: record.subscription_expires_at,
    })),
    Ok(None) => Ok(None),
    Err(e) => Err(e.into()),
  }
}

// QueryAs<'q, Postgres, O, PgArguments>
fn query<'q>(user_token: &UserToken)
  -> sqlx::query::Map<'static, MySql, impl Send + FnMut(MySqlRow) -> Result<RawArtcraftSubscription, sqlx::Error>, MySqlArguments> {
  // NB: We want to eventually support multiple wallets per user (eg. company use case),
  // so we do not have a unique key on user token. In the meantime, to ensure we use the
  // same wallet each time, we order by id and take the first one.
  sqlx::query_as!(
    RawArtcraftSubscription,
    r#"
SELECT
  user_token as `user_token: tokens::tokens::users::UserToken`,
  subscription_namespace as `subscription_namespace: enums::common::subscription_namespace::SubscriptionNamespace`,
  subscription_product_slug as `subscription_product_slug: enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug`,
  maybe_stripe_customer_id,
  maybe_stripe_subscription_id,
  maybe_stripe_subscription_status,
  maybe_stripe_invoice_is_paid,
  subscription_start_at,
  subscription_expires_at

FROM user_subscriptions

WHERE
  user_token = ?
  AND subscription_namespace = 'artcraft'
  AND maybe_stripe_customer_id IS NOT NULL
  AND maybe_stripe_subscription_id IS NOT NULL
  AND maybe_stripe_subscription_status IS NOT NULL
  AND maybe_stripe_subscription_status NOT IN ('canceled', 'incomplete_expired')
  AND subscription_expires_at > CURRENT_TIMESTAMP
  ORDER BY id ASC
  LIMIT 1
    "#,
    user_token.as_str()
  )
}


#[derive(sqlx::FromRow)]
struct RawArtcraftSubscription {
  user_token: UserToken,

  subscription_namespace: SubscriptionNamespace,
  subscription_product_slug: ArtcraftSubscriptionSlug,

  maybe_stripe_customer_id: Option<String>,
  maybe_stripe_subscription_id: Option<String>,
  maybe_stripe_subscription_status: Option<String>,
  maybe_stripe_invoice_is_paid: Option<i8>,

  subscription_start_at: DateTime<Utc>,
  subscription_expires_at: DateTime<Utc>,
}
