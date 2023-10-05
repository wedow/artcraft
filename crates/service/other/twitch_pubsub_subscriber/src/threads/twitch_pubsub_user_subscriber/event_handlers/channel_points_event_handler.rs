use std::sync::Arc;
use std::sync::RwLock;

use anyhow::anyhow;
use log::info;
use sqlx::MySql;
use twitch_api2::pubsub::channel_points::{ChannelPointsChannelV1, ChannelPointsChannelV1Reply, Redemption};

use container_common::anyhow_result::AnyhowResult;
use container_common::collections::random_from_vec::random_from_vec;
use mysql_queries::column_types::twitch_event_category::TwitchEventCategory;
use mysql_queries::complex_models::event_match_predicate::EventMatchPredicate;
use mysql_queries::complex_models::event_responses::EventResponse;
use mysql_queries::queries::twitch::twitch_pubsub::insert_channel_points::TwitchPubsubChannelPointsInsertBuilder;

use crate::threads::twitch_pubsub_user_subscriber::subscriber_preferences_cache::{TwitchEventRuleLight, TwitchPubsubCachedState};
use crate::threads::twitch_pubsub_user_subscriber::tts_writer::TtsWriter;

pub struct ChannelPointsEventHandler {
  twitch_subscriber_state: Arc<RwLock<TwitchPubsubCachedState>>,
  mysql_pool: Arc<sqlx::Pool<MySql>>,
  tts_writer: Arc<TtsWriter>,
}

impl ChannelPointsEventHandler {
  pub fn new(
    twitch_subscriber_state: Arc<RwLock<TwitchPubsubCachedState>>,
    mysql_pool: Arc<sqlx::Pool<MySql>>,
    tts_writer: Arc<TtsWriter>,
  ) -> Self {
    Self {
      twitch_subscriber_state,
      mysql_pool,
      tts_writer
    }
  }

  // NB: &mut is for Redis pool in downstream write_tts.
  pub async fn handle(&self, topic: ChannelPointsChannelV1, reply: Box<ChannelPointsChannelV1Reply>) -> AnyhowResult<()> {
    match *reply {
      // Unimplemented
      ChannelPointsChannelV1Reply::CustomRewardUpdated { .. } => {}
      ChannelPointsChannelV1Reply::RedemptionStatusUpdate { .. } => {}
      ChannelPointsChannelV1Reply::UpdateRedemptionStatusesFinished { .. } => {}
      ChannelPointsChannelV1Reply::UpdateRedemptionStatusProgress { .. } => {}
      // Implemented
      ChannelPointsChannelV1Reply::RewardRedeemed { timestamp, redemption } => {
        self.handle_reward_redeemed_event(&redemption).await?;
      }
      _ => {},
    }
    Ok(())
  }

  async fn handle_reward_redeemed_event(&self, redemption: &Redemption) -> AnyhowResult<()> {
    let maybe_rule = self.find_matching_rule(redemption)?;
    if let Some(rule) = maybe_rule {
      info!("Channel Points rule matched: {}", &rule.token);
      self.handle_matched_rule(&rule, redemption).await?;
      self.report_event_for_analytics(redemption).await?; // Report event for analytics
    }
    Ok(())
  }

  async fn report_event_for_analytics(&self, redemption: &Redemption) -> AnyhowResult<()> {
    let mut event_builder = TwitchPubsubChannelPointsInsertBuilder::new();

    let user_id = redemption.user.id.to_string();
    let user_name = redemption.user.login.to_string();

    let mut event_builder = event_builder.set_sender_twitch_user_id(&user_id)
        .set_sender_twitch_username(&user_name)
        .set_destination_channel_id(redemption.channel_id.as_ref())
        // TODO:
        .set_destination_channel_name("todo: not available")
        .set_title(&redemption.reward.title)
        .set_prompt(&redemption.reward.prompt)
        .set_user_text_input(redemption.user_input.as_deref())
        .set_redemption_id(redemption.id.as_ref())
        .set_reward_id(redemption.reward.id.as_ref())
        .set_is_sub_only(redemption.reward.is_sub_only)
        .set_reward_cost(redemption.reward.cost as u64);
    // TODO:
    // .set_max_per_stream(redemption.reward.max_per_stream as u64)
    // .set_max_per_user_per_stream(redemption.reward.max_per_user_per_stream as u64);
    event_builder.insert(&self.mysql_pool).await?;

    Ok(())
  }

  fn find_matching_rule(&self, redemption: &Redemption) -> AnyhowResult<Option<TwitchEventRuleLight>> {
    return match self.twitch_subscriber_state.read() {
      Err(e) => { Err(anyhow!("Lock error: {:?}", e)) },
      Ok(state) => {
        info!("Checking channel points event against {} rules...", state.event_rules.len());
        let maybe_rule = state.event_rules.iter()
            .filter(|rule| !rule.rule_is_disabled)
            .filter(|rule| rule.event_category.eq(&TwitchEventCategory::ChannelPoints))
            .find(|rule| {
              match rule.event_match_predicate {
                EventMatchPredicate::NotSet {} => false, // Not set
                EventMatchPredicate::BitsCheermoteNameExactMatch { ..} => false, // Wrong type
                EventMatchPredicate::BitsCheermotePrefixSpendThreshold { .. } => false, // Wrong type
                EventMatchPredicate::BitsSpendThreshold { .. } => false, // Wrong type
                EventMatchPredicate::ChannelPointsRewardNameExactMatch { ref reward_name } => {
                  reward_name.eq_ignore_ascii_case(&redemption.reward.title)
                }
              }
            }).cloned();
        Ok(maybe_rule)
      }
    };
  }

  //noinspection DuplicatedCode
  async fn handle_matched_rule(&self, rule: &TwitchEventRuleLight, redemption: &Redemption) -> AnyhowResult<()> {
    let message = match redemption.user_input {
      None => return Ok(()), // Nothing to do.
      Some(ref m) => m.as_str(),
    };
    match rule.event_response {
      EventResponse::NotSet {} => {
        info!("Empty event response.");
        return Ok(())
      },
      EventResponse::TtsSingleVoice { ref tts_model_token } => {
        self.tts_writer.write_tts_with_model(message, tts_model_token).await?;
      }
      EventResponse::TtsRandomVoice { ref tts_model_tokens } => {
        let maybe_token = random_from_vec(tts_model_tokens);
        if let Some(token) = maybe_token {
          self.tts_writer.write_tts_with_model(message, token.as_str())
              .await?;
        }
      }
      EventResponse::TtsCommandPresets { .. } => {} // TODO
      EventResponse::TtsCommandCustom { .. } => {} // TODO
    }

    Ok(())
  }
}