use std::ops::Add;

use chrono::Utc;
use r2d2_redis::r2d2::PooledConnection;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;

use errors::AnyhowResult;

use crate::keys::premium::premium_ip_address_redis_key::PremiumIpAddressRedisKey;
use crate::keys::premium::premium_user_redis_key::PremiumUserRedisKey;
use crate::payloads::premium::inner_state::premium_payload::PremiumPayload;
use crate::traits::hkey_store_adapter::HkeyStoreAdapter;

pub struct PremiumIpAddressPayload {
  pub key: PremiumIpAddressRedisKey,
  pub payload: PremiumPayload,
}

impl PremiumIpAddressPayload {

  pub fn new(key: PremiumIpAddressRedisKey) -> Self {
    Self {
      key,
      payload: PremiumPayload::new(),
    }
  }

  pub fn read_from_redis(key: PremiumIpAddressRedisKey, redis: &mut PooledConnection<RedisConnectionManager>) -> AnyhowResult<Self> {
    let payload = PremiumPayload::read_from_redis(key.as_str(), redis)?;
    Ok(Self {
      key,
      payload,
    })
  }

  pub fn persist_to_redis_with_expiry(&self, redis: &mut PooledConnection<RedisConnectionManager>) -> AnyhowResult<()> {
    self.payload.persist_to_redis(self.key.as_str(), redis)?;
    self.set_key_expiry(redis)?;
    Ok(())
  }

  pub fn set_key_expiry(&self, redis: &mut PooledConnection<RedisConnectionManager>) -> AnyhowResult<()> {
    let expire_at= Utc::now()
        .add(PremiumUserRedisKey::get_redis_ttl())
        .timestamp() as usize;
    redis.expire_at::<_, ()>(self.key.as_str(), expire_at)?;
    Ok(())
  }
}
