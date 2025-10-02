use crate::sora_redis_credentials::keys::{BEARER_SUBKEY, COOKIE_SUBKEY, SENTINEL_SUBKEY, SORA_SECRET_REDIS_KEY};
use anyhow::anyhow;
use errors::AnyhowResult;
use openai_sora_client::creds::sora_credential_builder::SoraCredentialBuilder;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use r2d2_redis::r2d2::PooledConnection;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use std::collections::HashMap;

pub fn get_sora_credentials_from_redis(
  redis: &mut PooledConnection<RedisConnectionManager>
) -> AnyhowResult<SoraCredentialSet> {

  let values : HashMap<String, String> = redis.hgetall(SORA_SECRET_REDIS_KEY)
      .map_err(|e| anyhow!("Failed to get Sora credentials from Redis: {}", e))?;

  let bearer = values.get(BEARER_SUBKEY);
  let cookie = values.get(COOKIE_SUBKEY);
  let sentinel = values.get(SENTINEL_SUBKEY);

  match (bearer, cookie, sentinel) {
    (Some(b), Some(c), Some(s)) => {
      let creds = SoraCredentialBuilder::new()
          .with_jwt_bearer_token(&b)
          .with_cookies(&c)
          .with_sora_sentinel(&s)
          .build()?;
      Ok(creds)
    }
    _ => Err(anyhow!("redis sora credential values not present")),
  }
}
