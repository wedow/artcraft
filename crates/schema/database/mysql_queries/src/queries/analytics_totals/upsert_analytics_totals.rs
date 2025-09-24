use anyhow::anyhow;
use log::error;
use sqlx::{MySql, MySqlPool, QueryBuilder};
use sqlx::mysql::MySqlArguments;
use sqlx::pool::PoolConnection;
use sqlx::query::Query;
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::browser_session_logs::BrowserSessionLogToken;
use tokens::tokens::users::UserToken;

pub struct UpsertAnalyticsTotals {
  pub user_token: UserToken,
  pub ip_address: String,
  // TODO: Swap PaymentsNamespace (artcraft,fakeyou) for an AnalyticsNamespace enum.
  pub namespace: PaymentsNamespace,
}

impl UpsertAnalyticsTotals {

  fn query(&self) -> Query<MySql, MySqlArguments> {
    sqlx::query!(
        r#"
INSERT INTO analytics_totals
SET
  app_namespace = ?,
  user_token = ?,
  ip_address = ?,
  event_count = event_count + 1,
  last_event_at = NOW()
ON DUPLICATE KEY UPDATE
  ip_address = ?,
  event_count = event_count + 1,
  last_event_at = NOW()
        "#,
      &self.namespace.as_str(),
      &self.user_token,
      &self.ip_address,
      self.namespace.as_str(),
      &self.maybe_user_token,
      self.action_was_taken,
      self.should_ignore_retry,
    )
  }
}

pub async fn upsert_browser_session_log<'a>(args: UpsertAnalyticsTotalsArgs<'a>) -> AnyhowResult<BrowserSessionLogToken> {

  let token = args.maybe_log_token
      .map(|token| token.clone())
      .unwrap_or_else(|| BrowserSessionLogToken::generate());

  let maybe_last_action = args.maybe_last_action
      .map(|action| {
        let mut action = action.trim().to_string();
        action.truncate(32); // NB: Field is 32 wide.
        action
      });

  let query_result = sqlx::query!(
        r#"
INSERT INTO browser_session_logs
SET
  token = ?,
  ip_address = ?,
  maybe_user_token = ?,
  maybe_anonymous_visitor_token = ?,
  maybe_last_action = ?
ON DUPLICATE KEY UPDATE
  maybe_last_action = ?,
  update_count = update_count + 1,
  maybe_last_updated_at = NOW()
        "#,
      token.as_str(),
      args.ip_address,
      args.maybe_user_token.map(|t| t.as_str()),
      args.maybe_visitor_token.map(|t| t.as_str()),
      maybe_last_action.as_deref(),
      maybe_last_action.as_deref(),
    )
      .execute(args.mysql_pool)
      .await;

  match query_result {
    Ok(_) => Ok(token),
    Err(err) => {
      error!("Error with query: {:?}", &err);
      Err(anyhow!("query error: {:?}", &err))
    },
  }
}
