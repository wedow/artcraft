use chrono::Utc;
use sqlx::MySqlPool;
use sqlx_core::any::AnyConnectionBackend;
use sqlx_core::connection::Connection;

use sqlx::{MySqlConnection, Executor};

use errors::AnyhowResult;

#[test]
fn test_that_this_compiles() {
  // This test only exists as an integration test with the package.
  // When we do upgrades of SQLx, the binding between sqlx, our macros,
  // and our code can break down. Having this thin use case helps us
  // deal with migration difficulties.
  //
  // Unfortunately this code requires access to a database or cached queries to compile, so
  // we may want to rethink this strategy in the future.
  assert_eq!(1, 1);
}

/// Query available (non-deleted) API tokens for a user.
/// A user can only have five active tokens at a time, so we only return the five most recent.
pub async fn list_available_api_tokens_for_user(
  user_token: &str,
  pool: &MySqlPool,
) -> AnyhowResult<()> {

  let _records : Vec<AvailableApiTokenInternal> = sqlx::query_as!(
      AvailableApiTokenInternal,
        r#"
SELECT
  true as testing,
  internal_token
  -- api_token
  -- maybe_short_description
  -- created_at,
  -- updated_at
FROM api_tokens
WHERE
  user_token = ?
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 5
        "#,
      user_token,
    )
      .fetch_all(pool)
      .await?;

  Ok(())
}

#[derive(Debug)]
struct AvailableApiTokenInternal {
  pub testing: i64,
  pub internal_token: String,
  //pub api_token: String,
  //pub maybe_short_description: Option<String>,
  //pub created_at: chrono::DateTime<Utc>,
  //pub updated_at: chrono::DateTime<Utc>,
}
