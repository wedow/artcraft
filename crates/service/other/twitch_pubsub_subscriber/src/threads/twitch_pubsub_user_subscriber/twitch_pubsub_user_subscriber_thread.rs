use std::ops::Sub;
use std::sync::{Arc, RwLock};
use std::thread::sleep;
use std::time::Duration;

use anyhow::anyhow;
use log::error;
use log::info;
use log::warn;
use r2d2_redis::r2d2;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use sqlx::MySql;
use time::Duration as  TimeDuration;
use time::Instant;
use twitch_api2::pubsub::{Response, TopicData, TwitchResponse};

use container_common::anyhow_result::AnyhowResult;
use container_common::thread::thread_id::ThreadId;
use mysql_queries::complex_models::event_match_predicate::EventMatchPredicate;
use mysql_queries::complex_models::event_responses::EventResponse;
use mysql_queries::queries::tts::tts_inference_jobs::insert_tts_inference_job::TtsInferenceJobInsertBuilder;
use mysql_queries::queries::twitch::twitch_event_rules::list_twitch_event_rules_for_user::list_twitch_event_rules_for_user;
use mysql_queries::queries::twitch::twitch_oauth::find::{TwitchOauthTokenFinder, TwitchOauthTokenRecord};
use mysql_queries::queries::twitch::twitch_oauth::insert::TwitchOauthTokenInsertBuilder;
use mysql_queries::tokens::Tokens;
use redis_common::payloads::lease_payload::LeasePayload;
use redis_common::redis_keys::RedisKeys;
use redis_common::shared_constants::LEASE_CHECK_PERIOD;
use redis_common::shared_constants::LEASE_RENEW_PERIOD;
use redis_common::shared_constants::LEASE_TIMEOUT_SECONDS;
use redis_common::shared_constants::OBS_ACTIVE_CHECK_PERIOD;
use redis_common::shared_constants::STREAMER_TTS_JOB_QUEUE_TTL_SECONDS;
use twitch_common::cheers::remove_cheers;
use twitch_common::twitch_user_id::TwitchUserId;

use crate::threads::twitch_pubsub_user_subscriber::event_handlers::bits_event_handler::BitsEventHandler;
use crate::threads::twitch_pubsub_user_subscriber::event_handlers::channel_points_event_handler::ChannelPointsEventHandler;
use crate::threads::twitch_pubsub_user_subscriber::subscriber_preferences_cache::TwitchEventRuleLight;
use crate::threads::twitch_pubsub_user_subscriber::subscriber_preferences_cache::TwitchPubsubCachedState;
use crate::threads::twitch_pubsub_user_subscriber::tts_writer::TtsWriter;
use crate::twitch::constants::TWITCH_PING_CADENCE;
use crate::twitch::oauth::oauth_token_refresher::OauthTokenRefresher;
use crate::twitch::pubsub::build_pubsub_topics_for_user::build_pubsub_topics_for_user;
use crate::twitch::websocket_client::TwitchWebsocketClient;

// TODO: Publish events back to OBS thread
// TODO: (cleanup) make the logic clearer to follow.

pub const REFRESH_WEBSITE_SETTINGS_CADENCE : TimeDuration = TimeDuration::minutes(2);

// =========================================
// =============== STAGE ONE ===============
// =========================================

pub struct TwitchPubsubUserSubscriberThread {
  thread_id: ThreadId,
  server_hostname: String,
  twitch_user_id: TwitchUserId,
  maybe_user_token: Option<String>, // Storyteller user
  oauth_token_refresher: OauthTokenRefresher,
  mysql_pool: Arc<sqlx::Pool<MySql>>,
  redis_pool: Arc<r2d2::Pool<RedisConnectionManager>>,
  twitch_subscriber_state: Arc<RwLock<TwitchPubsubCachedState>>,
}

impl TwitchPubsubUserSubscriberThread {
  pub fn new(
    twitch_user_id: TwitchUserId,
    oauth_token_refresher: OauthTokenRefresher,
    mysql_pool: Arc<sqlx::Pool<MySql>>,
    redis_pool: Arc<r2d2::Pool<RedisConnectionManager>>,
    server_hostname: &str,
    thread_id: ThreadId,
  ) -> Self {
    Self {
      thread_id,
      oauth_token_refresher,
      server_hostname: server_hostname.to_string(),
      twitch_user_id,
      maybe_user_token: None,
      mysql_pool,
      redis_pool,
      twitch_subscriber_state: Arc::new(RwLock::new(TwitchPubsubCachedState::new())),
    }
  }

  pub async fn start_thread(mut self) {
    // By failing to look this up, the thread will fail fast.
    // When the user auths, the thread will be picked back up again.
    let lookup_result
        = lookup_oauth_record(&self.twitch_user_id, &self.mysql_pool).await;

    let mut record = match lookup_result {
      Ok(Some(record)) => record,
      Ok(None) => {
        error!("No twitch oauth token record");
        return;
      }
      Err(e) => {
        error!("Error looking up twitch oauth token record: {:?}", e);
        return;
      }
    };

    self.maybe_user_token = record.maybe_user_token.clone();

    let expected_lease_payload
        = LeasePayload::from_thread_id(&self.server_hostname, &self.thread_id);

    loop {
      info!("Connecting to Twitch PubSub for user {}...", &record.twitch_username);
      let maybe_client =
          self.create_subscribed_twitch_client(&record.access_token).await;

      let twitch_websocket_client = match maybe_client {
        Ok(client) => client,
        Err(e) => {
          error!("Error building Twitch client (exiting thread): {:?}", e);
          return;
        }
      };

      let tts_writer = Arc::new(TtsWriter::new(
        self.mysql_pool.clone(),
        self.redis_pool.clone(),
        self.twitch_user_id.clone(),
      ));

      let bits_event_handler = BitsEventHandler::new(
        self.twitch_subscriber_state.clone(),
        self.mysql_pool.clone(),
        tts_writer.clone(),
      );

      let channel_points_event_handler = ChannelPointsEventHandler::new(
        self.twitch_subscriber_state.clone(),
        self.mysql_pool.clone(),
        tts_writer.clone(),
      );

      // NB: All of the timers (thus far) can wait to run.
      // We set their first run time to now so we don't have to deal with Option<>.
      let now = Instant::now();

      // NB(2022-02-20): Actually, we can set these in the past with a bit of a hack.
      let long_ago = Instant::now().sub(Duration::from_secs(60*60*24));

      let thread = TwitchPubsubUserSubscriberThreadStageTwo {
        thread_id: self.thread_id.clone(),
        server_hostname: self.server_hostname.clone(),
        twitch_user_id: self.twitch_user_id.clone(),
        maybe_user_token: self.maybe_user_token.clone(),
        oauth_token_refresher: self.oauth_token_refresher.clone(),
        mysql_pool: self.mysql_pool.clone(),
        redis_pool: self.redis_pool.clone(),
        twitch_websocket_client,
        expected_lease_payload: expected_lease_payload.clone(),
        twitch_oauth_token_record: record.clone(),
        redis_lease_last_renewed_at: now,
        redis_lease_last_checked_at: now,
        obs_session_active_last_checked_at: now,
        twitch_last_pinged_at: now,
        twitch_subscriber_state: self.twitch_subscriber_state.clone(),
        website_settings_last_refreshed_at: long_ago,
        channel_points_event_handler,
        bits_event_handler,
      };

      // NB: The following call will run its main loop until/unless the Twitch client
      // fails to auth or disconnects. If this happens, we'll try again.
      match thread.continue_thread().await {
        Ok(LoopEndedReason::ExitThread { reason}) => {
          warn!("Thread has ended with reason: {}", reason);
          return;
        }
        Ok(LoopEndedReason::RefreshedOauthToken { token }) => {
          warn!("OAuth token was refreshed.");
          record = token;
          sleep(Duration::from_secs(3));
        }
        Err(e) => {
          error!("There was an error, restarting thread shortly: {:?}", e);
          sleep(Duration::from_secs(15));
          continue;
        }
      }
    }
  }

  async fn create_subscribed_twitch_client(
    &self,
    access_token: &str
  ) -> AnyhowResult<TwitchWebsocketClient> {
    let mut twitch_websocket_client = TwitchWebsocketClient::new()?;

    twitch_websocket_client.connect().await?;
    twitch_websocket_client.send_ping().await?;

    // NB: Failure to auth won't be immediate.
    let topics = build_pubsub_topics_for_user(self.twitch_user_id.get_numeric());
    twitch_websocket_client.listen(access_token, &topics).await?;

    Ok(twitch_websocket_client)
  }
}

// =========================================
// =============== STAGE TWO ===============
// =========================================

/// The thread is somewhat of a state machine.
/// The first stage of thread startup can end prematurely, which is why
/// this is modeled as two different structs.
struct TwitchPubsubUserSubscriberThreadStageTwo {
  thread_id: ThreadId,
  server_hostname: String,
  twitch_user_id: TwitchUserId,
  maybe_user_token: Option<String>,
  oauth_token_refresher: OauthTokenRefresher,
  mysql_pool: Arc<sqlx::Pool<MySql>>,
  redis_pool: Arc<r2d2::Pool<RedisConnectionManager>>,

  // ========== CACHE ==========

  twitch_subscriber_state: Arc<RwLock<TwitchPubsubCachedState>>,

  // ========== Handlers ==========

  bits_event_handler: BitsEventHandler,
  channel_points_event_handler: ChannelPointsEventHandler,

  // ========== Stage Two Thread State ==========

  twitch_websocket_client: TwitchWebsocketClient,

  // We'll use this again and again, so precompute it.
  expected_lease_payload: LeasePayload,

  // The user's oauth access and refresh tokens.
  twitch_oauth_token_record: TwitchOauthTokenRecord,

  // The thread must renew the lease, or another worker will pick it up.
  // If the lease gets taken by another, we abandon our own workload.
  redis_lease_last_renewed_at: Instant,

  // If the lease gets taken by another thread, we abandon our own workload.
  // This controls when we periodically check.
  redis_lease_last_checked_at: Instant,

  // Check if the OBS session is still active.
  // If the underlying Redis key dies, we abandon our thread.
  obs_session_active_last_checked_at: Instant,

  /// Twitch PubSub requires PINGs at regular intervals,
  ///   "To keep the server from closing the connection, clients must send a PING
  ///    command at least once every 5 minutes. If a client does not receive a PONG
  ///    message within 10 seconds of issuing a PING command, it should reconnect
  ///    to the server. See details in Handling Connection Failures."
  twitch_last_pinged_at: Instant,

  // When we last reloaded the website settings
  website_settings_last_refreshed_at: Instant,
}

impl TwitchPubsubUserSubscriberThreadStageTwo {

  /// This function will loop until it either errors or hits a `LoopEndedReason` condition.
  /// The caller will need to handle these cases.
  pub async fn continue_thread(mut self) -> AnyhowResult<LoopEndedReason> {
    loop {
      let is_valid = self.maybe_check_redis_lease_is_valid()?;
      if !is_valid {
        return Ok(LoopEndedReason::ExitThread { reason: "Thread lease taken".to_string() });
      }

      self.maybe_renew_redis_lease()?;
      self.maybe_send_twitch_ping().await?;

      let is_active = self.maybe_check_obs_session_active()?;
      if !is_active {
        return Ok(LoopEndedReason::ExitThread { reason: "OBS session ended".to_string() });
      }

      self.maybe_refresh_website_user_settings().await?;

      // NB: We can't have calls to read the Twitch websocket client block forever, and they
      // would do exactly that if not for this code. This is adapted from the very good example
      // in the `tokio-tungstenite` repo, which also contains good recipes for splitting sockets
      // into two unidirectional streams:
      // https://github.com/snapview/tokio-tungstenite/blob/master/examples/interval-server.rs
      let mut interval = tokio::time::interval(Duration::from_secs(1));
      tokio::select! {
        maybe_event = self.twitch_websocket_client.try_next() => {
          if let Some(loop_end_reason) = self.handle_event(maybe_event).await? {
            return Ok(loop_end_reason);
          }
        }
        _ = interval.tick() => {
          sleep(Duration::from_secs(1));
        }
      }

      sleep(Duration::from_secs(1));
    }
  }

  // =============== TWITCH PUBSUB EVENTS ===============

  async fn handle_event(
    &mut self,
    maybe_event: AnyhowResult<Option<twitch_api2::pubsub::Response>>
  ) -> AnyhowResult<Option<LoopEndedReason>> {

    let maybe_event = maybe_event.map_err(|error| {
      error!("socket error: {:?}", error);
      error
    })?;

    let event = match maybe_event {
      None => return Ok(None),
      Some(event) => event,
    };

    info!("event: {:?}", event);

    match event {
      Response::Response(response) => {
        // NB: Auth failure might cause the loop to end.
        return self.handle_maybe_auth_error_event(response).await;
      }
      Response::Message { data } => {
        self.handle_pubsub_topic_event(data).await?;
      }
      Response::Pong => {}
      Response::Reconnect => {}
    }

    Ok(None) // Don't end loop
  }

  async fn handle_maybe_auth_error_event(&mut self, response: TwitchResponse)
    -> AnyhowResult<Option<LoopEndedReason>>
  {
    let error = match response.error.as_deref() {
      None => return Ok(None),
      Some(e) => e,
    };
    match error {
      "" => {}, // No-op
      "ERR_BADAUTH" => {
        warn!("Invalid token. Bad auth. Need to refresh");
        let token_record = self.refresh_twitch_oauth_token().await?;
        return Ok(Some(LoopEndedReason::RefreshedOauthToken { token: token_record }));
      }
      _ => warn!("Unknown Twitch PubSub error: {:?}", error),
    }
    Ok(None)
  }

  async fn handle_pubsub_topic_event(&mut self, topic_data: TopicData) -> AnyhowResult<()> {
    match topic_data {
      // Unimplemented
      TopicData::AutoModQueue { .. } => {}
      TopicData::ChannelBitsBadgeUnlocks { .. } => {}
      TopicData::ChatModeratorActions { .. } => {}
      TopicData::ChannelSubscribeEventsV1 { .. } => {}
      TopicData::CommunityPointsChannelV1 { .. } => {}
      TopicData::ChannelCheerEventsPublicV1 { .. } => {}
      TopicData::ChannelSubGiftsV1 { .. } => {}
      TopicData::VideoPlayback { .. } => {}
      TopicData::VideoPlaybackById { .. } => {}
      TopicData::HypeTrainEventsV1 { .. } => {}
      TopicData::HypeTrainEventsV1Rewards { .. } => {}
      TopicData::Following { .. } => {}
      TopicData::Raid { .. } => {}
      TopicData::UserModerationNotifications { .. } => {}
      // Implemented
      TopicData::ChannelBitsEventsV2 { topic, reply } => {
        self.bits_event_handler.handle(topic, reply).await?;
      }
      TopicData::ChannelPointsChannelV1 { topic, reply } => {
        self.channel_points_event_handler.handle(topic, reply).await?;
      }
    }

    Ok(())
  }

  // =============== TWITCH PUBSUB KEEPALIVE ===============

  async fn maybe_send_twitch_ping(&mut self) -> AnyhowResult<()> {
    let mut should_send_ping = self.twitch_last_pinged_at
        .elapsed()
        .gt(&TWITCH_PING_CADENCE);

    if should_send_ping {
      info!("Sending Twitch ping for user {}", self.twitch_user_id.get_numeric());
      self.twitch_websocket_client.send_ping().await?;
      self.twitch_last_pinged_at = Instant::now();
    }

    Ok(())
  }

  // =============== REDIS THREAD LEASE ===============

  fn maybe_check_redis_lease_is_valid(&mut self) -> AnyhowResult<bool> {
    let mut should_check_lease = self.redis_lease_last_checked_at
        .elapsed()
        .gt(&LEASE_CHECK_PERIOD);

    if should_check_lease {
      info!("Checking Redis Lease for user {}", self.twitch_user_id.get_numeric());
      let is_valid = self.check_redis_lease_is_valid()?;

      if !is_valid {
        warn!("Lease got taken by another thread");
        return Ok(false);
      }

      self.redis_lease_last_checked_at = Instant::now();
    }

    Ok(true)
  }

  fn check_redis_lease_is_valid(&mut self) -> AnyhowResult<bool> {
    let mut redis = self.redis_pool.get()?;
    let lease_key = RedisKeys::twitch_pubsub_lease(self.twitch_user_id.get_str());

    let payload : Option<String> = redis.get(&lease_key)?;
    match payload {
      None => {
        warn!("Redis lease payload absent. Another thread could be started.");
        Ok(true)
      }
      Some(payload) => {
        let actual_payload = LeasePayload::deserialize(&payload)?;
        let equals_expected = self.expected_lease_payload.eq(&actual_payload);
        Ok(equals_expected)
      }
    }
  }

  fn maybe_renew_redis_lease(&mut self) -> AnyhowResult<()> {
    let mut should_renew_lease = self.redis_lease_last_renewed_at
        .elapsed()
        .gt(&LEASE_RENEW_PERIOD);

    if should_renew_lease {
      info!("Renewing Redis Lease for user {}", self.twitch_user_id.get_numeric());
      self.renew_redis_lease()?;
      self.redis_lease_last_renewed_at = Instant::now();
    }

    Ok(())
  }

  fn renew_redis_lease(&mut self) -> AnyhowResult<()> {
    let mut redis = self.redis_pool.get()?;

    let lease_key = RedisKeys::twitch_pubsub_lease(self.twitch_user_id.get_str());
    let lease_value = self.expected_lease_payload.serialize();

    let _v : Option<String> = redis.set_ex(
      &lease_key,
      &lease_value,
      LEASE_TIMEOUT_SECONDS
    )?;
    Ok(())
  }

  // =============== OBS SESSION ACTIVITY ===============

  fn maybe_check_obs_session_active(&mut self) -> AnyhowResult<bool> {
    let mut should_check_active = self.obs_session_active_last_checked_at
        .elapsed()
        .gt(&OBS_ACTIVE_CHECK_PERIOD);

    if should_check_active {
      info!("Checking OBS active for user {}", self.twitch_user_id.get_numeric());
      let is_active = self.check_obs_session_active()?;

      if !is_active {
        warn!("OBS session is no longer active");
        return Ok(false);
      }

      self.obs_session_active_last_checked_at = Instant::now();
    }

    Ok(true)
  }

  fn check_obs_session_active(&mut self) -> AnyhowResult<bool> {
    let mut redis = self.redis_pool.get()?;
    let key = RedisKeys::obs_active_session_keepalive(self.twitch_user_id.get_str());

    // The value doesn't matter, just the presence of the key.
    let payload : Option<String> = redis.get(&key)?;
    match payload {
      None => Ok(false),
      Some(_payload) => Ok(true),
    }
  }

  // =============== OAUTH TOKEN LOOKUP AND RENEWAL ===============

  async fn refresh_twitch_oauth_token(&mut self) -> AnyhowResult<TwitchOauthTokenRecord> {
    let refresh_token = match self.twitch_oauth_token_record.maybe_refresh_token.as_deref() {
      Some(token) => token,
      None => {
        error!("No refresh token present. Cannot refresh");
        return Err(anyhow!("No refresh token present. Cannot refresh!"));
      },
    };

    let refresh_result = self.oauth_token_refresher.refresh_token(refresh_token)
        .await?;

    let access_token = refresh_result.access_token.secret().to_string();
    let refresh_token : Option<String> = refresh_result.maybe_refresh_token
        .map(|t| t.secret().to_string());
    let expires_seconds = refresh_result.duration.as_secs() as u32;

    // TODO: Move saving a refreshed record somewhere common
    let mut query_builder = TwitchOauthTokenInsertBuilder::new(
      &self.twitch_oauth_token_record.twitch_user_id,
      &self.twitch_oauth_token_record.twitch_username,
      &access_token,
    &self.twitch_oauth_token_record.oauth_refresh_grouping_token)
        .set_refresh_token(refresh_token.as_deref())
        .set_user_token(self.twitch_oauth_token_record.maybe_user_token.as_deref())
        .set_expires_in_seconds(Some(expires_seconds))
        .set_refresh_count(self.twitch_oauth_token_record.refresh_count.saturating_add(1))
        // NB: We don't get these back from the refresh, but it seems like they would stay the same.
        .set_token_type(self.twitch_oauth_token_record.token_type.as_deref())
        .has_bits_read(self.twitch_oauth_token_record.has_bits_read)
        .has_channel_read_redemptions(self.twitch_oauth_token_record.has_channel_read_redemptions)
        .has_channel_read_subscriptions(self.twitch_oauth_token_record.has_channel_read_subscriptions)
        .has_chat_edit(self.twitch_oauth_token_record.has_chat_edit)
        .has_chat_read(self.twitch_oauth_token_record.has_chat_read);

    query_builder.insert(&self.mysql_pool).await?;

    let maybe_inserted
        = lookup_oauth_record(&self.twitch_user_id, &self.mysql_pool).await?;

    let new_record = match maybe_inserted {
      Some(record) => record,
      None => {
        error!("Did not find oauth token record in database upon refresh");
        return Err(anyhow!("Did not find oauth token record in database upon refresh"));
      }
    };

    // NB: Instead of resetting the local loop state, we'll create a fresh new Twitch client.
    // TODO: Compare a "refresh_count"
    self.twitch_oauth_token_record = new_record.clone();

    Ok(new_record)
  }

  // =============== TTS EVENTS ===============

  async fn write_tts_inference_event(&mut self, tts_text: &str) -> AnyhowResult<()> {
    let sanitized_text = remove_cheers(tts_text);
    let job_token = Tokens::new_tts_inference_job()?;
    //let model_token = "TM:7wbtjphx8h8v"; // "Mario *" voice (prod)
    let model_token = "TM:40m3aqtt41y0"; // "Wakko" voice (dev)

    let mut builder = TtsInferenceJobInsertBuilder::new_for_internal_tts()
        .set_is_for_twitch(true)
        .set_priority_level(1)
        .set_job_token(&job_token)
        .set_model_token(model_token)
        .set_raw_inference_text(&sanitized_text);

    builder.insert(&self.mysql_pool).await?;

    // TODO: Report job token to frontend
    let mut redis = self.redis_pool.get()?;
    let redis_key = RedisKeys::twitch_tts_job_queue(self.twitch_user_id.get_str());

    let _size : Option<u64> = redis.rpush(&redis_key, job_token)?;
    let _size : Option<u64> = redis.expire(&redis_key, STREAMER_TTS_JOB_QUEUE_TTL_SECONDS)?;

    Ok(())
  }

  // =============== WEBSITE SETTINGS ===============

  async fn maybe_refresh_website_user_settings(&mut self) -> AnyhowResult<()> {
    let user_token = match self.maybe_user_token.as_deref() {
      Some(token) => token,
      None => {
        // Only Twitch users with a storyteller account get settings.
        return Ok(());
      }
    };

    let mut should_refresh = self.website_settings_last_refreshed_at
        .elapsed()
        .gt(&REFRESH_WEBSITE_SETTINGS_CADENCE);

    if !should_refresh {
      return Ok(());
    }

    info!("Reloading website settings for user {}", self.twitch_user_id.get_numeric());

    let event_rules =
        lookup_event_rules(user_token, &self.mysql_pool).await?;

    match self.twitch_subscriber_state.write() {
      Err(e) => {
        return Err(anyhow!("Lock error: {:?}", e))
      },
      Ok(mut lock) => {
        lock.event_rules = event_rules;
      }
    }

    self.website_settings_last_refreshed_at = Instant::now();

    Ok(())
  }
}

// ====================================
// =============== MISC ===============
// ====================================

async fn lookup_oauth_record(
  twitch_user_id: &TwitchUserId,
  mysql_pool: &sqlx::Pool<MySql>
) -> AnyhowResult<Option<TwitchOauthTokenRecord>> {
  TwitchOauthTokenFinder::new()
      .scope_twitch_user_id(Some(twitch_user_id.get_numeric()))
      .allow_expired_tokens(true)
      .perform_query(mysql_pool)
      .await
}

async fn lookup_event_rules(
  user_token: &str,
  mysql_pool: &sqlx::Pool<MySql>
) -> AnyhowResult<Vec<TwitchEventRuleLight>> {
  let rules = list_twitch_event_rules_for_user(user_token, mysql_pool)
      .await?;
  let rules = rules.into_iter()
      .map(|rule| {
        let event_match_predicate = serde_json::from_str(&rule.event_match_predicate)
            .unwrap_or_else(|e| {
              error!("Issue with deserializing: {}", e);
              EventMatchPredicate::NotSet {}
            });
        let event_response = serde_json::from_str(&rule.event_response)
            .unwrap_or_else(|e| {
              error!("Issue with deserializing: {}", e);
              EventResponse::NotSet {}
            });
        TwitchEventRuleLight {
          token: rule.token,
          event_category: rule.event_category,
          event_match_predicate,
          event_response,
          user_specified_rule_order: rule.user_specified_rule_order,
          rule_is_disabled: rule.rule_is_disabled,
        }
      })
      .collect();
  Ok(rules)
}

enum LoopEndedReason {
  /// Terminate the thread
  ExitThread { reason: String },
  /// A new OAuth token was minted.
  RefreshedOauthToken { token: TwitchOauthTokenRecord }
}
