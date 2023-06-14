// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]

use anyhow::anyhow;
use errors::AnyhowResult;
use log::warn;
use sqlx::{Executor, MySql};

#[derive(Clone, Serialize, Deserialize)]
pub struct SessionRecord {
  pub session_token: String,
  pub user_token: String,
}

pub async fn get_user_session_by_token_light<'e, 'c : 'e, E>(
  mysql_executor: E,
  session_token: &str,
) -> AnyhowResult<Option<SessionRecord>>
  where E: 'e + Executor<'c, Database = MySql>
{
  let maybe_session_record = sqlx::query_as!(
      SessionRecord,
        r#"
SELECT
    token as session_token,
    user_token
FROM user_sessions
WHERE token = ?
AND deleted_at IS NULL
        "#,
        session_token,
    )
      .fetch_one(mysql_executor)
      .await;

  match maybe_session_record {
    Ok(session_record) => Ok(Some(session_record)),
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          warn!("Valid cookie; invalid session: {}", session_token);
          Ok(None)
        },
        _ => {
          warn!("Session query error: {:?}", err);
          Err(anyhow!("session query error: {:?}", err))
        }
      }
    }
  }
}
