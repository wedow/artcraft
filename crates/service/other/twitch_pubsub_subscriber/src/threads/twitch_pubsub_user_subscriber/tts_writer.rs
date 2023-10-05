use std::sync::Arc;

use log::info;
use r2d2_redis::r2d2;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use sqlx::MySql;

use container_common::anyhow_result::AnyhowResult;
use mysql_queries::queries::tts::tts_inference_jobs::insert_tts_inference_job::TtsInferenceJobInsertBuilder;
use mysql_queries::tokens::Tokens;
use redis_common::redis_keys::RedisKeys;
use tts_common::priority::TWITCH_TTS_PRIORITY_LEVEL;
use twitch_common::cheers::remove_cheers;
use twitch_common::twitch_user_id::TwitchUserId;

pub struct TtsWriter {
  mysql_pool: Arc<sqlx::Pool<MySql>>,
  redis_pool: Arc<r2d2::Pool<RedisConnectionManager>>,
  twitch_user_id: TwitchUserId,
}

impl TtsWriter {

  pub fn new(
    mysql_pool: Arc<sqlx::Pool<MySql>>,
    redis_pool: Arc<r2d2::Pool<RedisConnectionManager>>,
    twitch_user_id: TwitchUserId,
  ) -> Self {
    Self {
      mysql_pool,
      redis_pool,
      twitch_user_id,
    }
  }

  pub async fn write_tts(&self, message_text: &str) -> AnyhowResult<()> {
    //let model_token = "TM:7wbtjphx8h8v"; // "Mario *" voice (prod)
    let model_token = "TM:40m3aqtt41y0"; // "Wakko" voice (dev)
    self.write_tts_with_model(message_text, model_token).await
  }

  pub async fn write_tts_with_model(&self, message_text: &str, model_token: &str) -> AnyhowResult<()> {
    let sanitized_text = remove_cheers(message_text);
    let job_token = Tokens::new_tts_inference_job()?;

    info!("Writing TTS: model={}, text={}", model_token, sanitized_text);

    let mut builder = TtsInferenceJobInsertBuilder::new_for_internal_tts()
        .set_is_for_twitch(true)
        .set_priority_level(TWITCH_TTS_PRIORITY_LEVEL)
        .set_job_token(&job_token)
        .set_model_token(model_token)
        .set_raw_inference_text(&sanitized_text);

    builder.insert(&self.mysql_pool).await?;

    let mut redis = self.redis_pool.get()?;

    // NB: Be very careful when migrating PubSub Redis. This is starting to get a little messy
    //  with different aliases kept everywhere.
    let pubsub_key = RedisKeys::twitch_tts_job_topic(self.twitch_user_id.get_str());
    let _count_received : Option<u64> = redis.publish(&pubsub_key, job_token)?;

    Ok(())
  }
}