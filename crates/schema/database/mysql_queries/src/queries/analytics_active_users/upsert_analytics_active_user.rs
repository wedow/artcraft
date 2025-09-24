use crate::errors::upsert_error::UpsertError;
use enums::common::payments_namespace::PaymentsNamespace;
use sqlx::mysql::MySqlArguments;
use sqlx::pool::PoolConnection;
use sqlx::query::Query;
use sqlx::MySql;
use tokens::tokens::users::UserToken;

pub struct UpsertAnalyticsActiveUser {
  // TODO: Swap PaymentsNamespace (artcraft,fakeyou) for an AnalyticsNamespace enum.
  pub namespace: PaymentsNamespace,
  pub user_token: UserToken,
  pub ip_address: String,
}

impl UpsertAnalyticsActiveUser {
  fn query(&self) -> Query<MySql, MySqlArguments> {
    sqlx::query!(
        r#"
INSERT INTO analytics_active_users
SET
  app_namespace = ?,
  user_token = ?,
  ip_address = ?,
  measurement_count = measurement_count + 1,
  first_active_at = NOW(),
  last_active_at = NOW()
ON DUPLICATE KEY UPDATE
  ip_address = ?,
  measurement_count = measurement_count + 1,
  last_active_at = NOW()
        "#,
      &self.namespace.to_str(),
      &self.user_token.as_str(),
      &self.ip_address,
      self.ip_address,
    )
  }

  pub async fn upsert_with_connection(&self, mysql_connection: &mut PoolConnection<MySql>) -> Result<(), UpsertError> {
    let _query_result = self.query()
        .execute(&mut **mysql_connection)
        .await?;
    Ok(())
  }
}
