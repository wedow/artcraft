use log::error;
use sqlx::pool::PoolConnection;
use sqlx::MySql;

use errors::AnyhowResult;
use migration::text_to_speech::get_tts_model_for_enqueue_inference_migration::{get_tts_model_for_enqueue_inference_migration, TtsModelForEnqueueInferenceMigrationWrapper};
use redis_caching::redis_ttl_cache::RedisTtlCache;
use redis_common::redis_cache_keys::RedisCacheKeys;

// TODO: Read from in-memory TTS List cache first (!!!) for further performance savings

pub async fn get_tts_model_with_caching(
  model_token: &str,
  redis_ttl_cache: &RedisTtlCache,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Option<TtsModelForEnqueueInferenceMigrationWrapper>> {
  // NB: Copy due to move. Not a cloned ref due to clippy lint
  let model_token2 = model_token.to_string();

  let get_tts_model = move || {
    // NB: async closures are not yet stable in Rust, so we include an async block.
    async move {
      get_tts_model_for_enqueue_inference_migration(
        &model_token2,
        mysql_connection,
        true,
      ).await
    }
  };

  let cache_key = RedisCacheKeys::get_tts_model_for_inference_migration_endpoint(model_token);

  let mut redis_ttl_cache_connection = match redis_ttl_cache.get_connection() {
    Ok(connection) => connection,
    Err(err) => {
      // NB: Fail open (potentially dangerous).
      error!("Can't get redis cache: {:?}", err);
      return get_tts_model().await;
    }
  };

  redis_ttl_cache_connection.lazy_load_if_not_cached(&cache_key, move || {
    get_tts_model()
  }).await
}
