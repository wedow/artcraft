use std::sync::Arc;

use actix_web::{http::StatusCode, web, HttpRequest, HttpResponse, ResponseError};
use chrono::NaiveDateTime;
use log::{debug, error, warn};
use mysql_queries::queries::stats::get_unified_queue_stats::get_unified_queue_stats;
use redis_common::redis_cache_keys::RedisCacheKeys;
use utoipa::ToSchema;

use crate::http_server::endpoints::stats::result_transformer::{database_result_to_cacheable, CacheableQueueStats};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct GetUnifiedQueueStatsSuccessResponse {
  pub success: bool,
  pub cache_time: NaiveDateTime,

  /// Tell the frontend client how fast to refresh their view of this list.
  /// During an attack, we may want this to go extremely slow.
  pub refresh_interval_millis: u64,

  pub inference: ModernInferenceQueueStats,
  pub legacy_tts: LegacyQueueDetails,
}

#[derive(Serialize, ToSchema)]
pub struct LegacyQueueDetails {
  pub pending_job_count: u64,
}

#[derive(Serialize, ToSchema)]
pub struct ModernInferenceQueueStats {
  pub total_pending_job_count: u64,

  #[deprecated(note="the frontend uses this field, but we should switch to total_pending_job_count")]
  pub pending_job_count: u64,

  pub by_queue: ByQueueStats,
}

#[derive(Serialize, ToSchema)]
pub struct ByQueueStats {
  // Text to Speech
  pub pending_tacotron2_jobs: u64,
  pub pending_voice_designer: u64,

  // Voice Conversion
  pub pending_rvc_jobs: u64,
  pub pending_svc_jobs: u64,

  // Image
  pub pending_stable_diffusion: u64,

  // Video
  pub pending_face_animation_jobs: u64,
  pub pending_storyteller_studio: u64,
  pub pending_acting_face: u64,
}

#[derive(Debug, ToSchema)]
pub enum GetUnifiedQueueStatsError {
  ServerError,
}

impl ResponseError for GetUnifiedQueueStatsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetUnifiedQueueStatsError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetUnifiedQueueStatsError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for GetUnifiedQueueStatsError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Get queue stats for most inference jobs (tts, voice conversion, comfy, etc.)
#[utoipa::path(
  get,
  tag = "Stats",
  path = "/v1/stats/queues",
  responses(
    (status = 200, description = "Success", body = GetUnifiedQueueStatsSuccessResponse),
    (status = 500, description = "Server error", body = GetUnifiedQueueStatsError),
  ),
)]
pub async fn get_unified_queue_stats_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetUnifiedQueueStatsError> {

  if server_state.flags.disable_unified_queue_stats_endpoint {
    // NB: Despite the cache being a powerful protector of the database (this is an expensive query),
    // if the cache goes stale during an outage, there is no protection. This feature flag lets us
    // shut off all traffic to the endpoint.
    return render_response_busy(GetUnifiedQueueStatsSuccessResponse {
      success: true,
      cache_time: NaiveDateTime::from_timestamp(0, 0),
      refresh_interval_millis: server_state.flags.frontend_unified_queue_stats_refresh_interval_millis,
      inference: ModernInferenceQueueStats {
        total_pending_job_count: 10_000,
        pending_job_count: 10_000,
        by_queue: ByQueueStats {
          pending_face_animation_jobs: 10_000,
          pending_storyteller_studio: 10_000,
          pending_rvc_jobs: 10_000,
          pending_svc_jobs: 10_000,
          pending_tacotron2_jobs: 10_000,
          pending_voice_designer: 10_000,
          pending_stable_diffusion: 10_000,
          pending_acting_face: 10_000,
        }
      },
      legacy_tts: LegacyQueueDetails {
        pending_job_count: 10_000,
      },
    });
  }

  let maybe_cached = server_state.caches.ephemeral.queue_stats.grab_copy_without_bump_if_unexpired()
      .map_err(|e| {
        error!("error consulting cache: {:?}", e);
        GetUnifiedQueueStatsError::ServerError
      })?;

  let cacheable_stats_result = match maybe_cached {
    Some(cached) => {
      debug!("serving from in-memory cache");
      cached
    },
    None => {
      debug!("populating unified queue stats from Redis *OR* database");

      let mysql_pool = server_state.mysql_pool.clone();

      let get_stats = move || {
        // NB: async closures are not yet stable in Rust, so we include an async block.
        async move {
          debug!("querying from database...");

          let db_result = get_unified_queue_stats(
            &mysql_pool
          ).await;

          db_result
              .map(|db_result| database_result_to_cacheable(db_result))
              .map(|cacheable_result| Some(cacheable_result)) // TODO/FIXME: Make a better redis cache
        }
      };

      // NB(2023-07-27): Double layers of caching (in-memory + Redis) is probably exorbitant, but this seems fine for now.
      // This endpoint's query (even when in-memory cached across the cluster) was causing the DB CPU to hit 100%.
      let stats_query_result = match server_state.redis_ttl_cache.get_connection() {
        Err(err) => {
          warn!("Error loading Redis connection from TTL cache (calling DB instead): {:?}", err);
          get_stats().await
        }
        Ok(mut redis_ttl_cache) => {
          let cache_key = RedisCacheKeys::get_unified_queue_stats_endpoint();
          redis_ttl_cache.lazy_load_if_not_cached(&cache_key, move || {
            get_stats()
          }).await
        }
      };

      match stats_query_result {
        // If the database misbehaves (eg. DDoS), let's stop spamming it.
        // We'll attempt to read the old value from the cache and keep going.
        Err(err) => {
          warn!("error querying database / inserting into cache: {:?}", err);

          let maybe_cached = server_state.caches.ephemeral.queue_stats.grab_even_expired_and_bump()
              .map_err(|err| {
                error!("error consulting cache (even expired): {:?}", err);
                GetUnifiedQueueStatsError::ServerError
              })?;

          maybe_cached.ok_or_else(|| {
            error!("error querying database and subsequently reading cache: {:?}", err);
            GetUnifiedQueueStatsError::ServerError
          })?
        }

        // Happy path...
        Ok(Some(cacheable_stats)) => {
          server_state.caches.ephemeral.queue_stats.store_copy(&cacheable_stats)
              .map_err(|e| {
                error!("error storing cache: {:?}", e);
                GetUnifiedQueueStatsError::ServerError
              })?;
          cacheable_stats
        }

        // TODO/FIXME(bt,2023-07-30): This match arm should never happen.
        Ok(None) => CacheableQueueStats::default()
      }
    },
  };

  render_response_ok(GetUnifiedQueueStatsSuccessResponse {
    success: true,
    cache_time: cacheable_stats_result.cache_time,
    refresh_interval_millis: server_state.flags.frontend_pending_inference_refresh_interval_millis,
    inference: ModernInferenceQueueStats {
      total_pending_job_count: cacheable_stats_result.queues.total_generic,
      pending_job_count: cacheable_stats_result.queues.total_generic,
      by_queue: ByQueueStats {
        pending_face_animation_jobs: cacheable_stats_result.queues.sad_talker,
        pending_rvc_jobs: cacheable_stats_result.queues.rvc_v2,
        pending_svc_jobs: cacheable_stats_result.queues.so_vits_svc,
        pending_tacotron2_jobs: cacheable_stats_result.queues.tacotron2,
        pending_voice_designer: cacheable_stats_result.queues.vall_e_x,
        pending_stable_diffusion: cacheable_stats_result.queues.stable_diffusion,
        pending_storyteller_studio: cacheable_stats_result.queues.storyteller_studio,
        pending_acting_face: cacheable_stats_result.queues.acting_face,
      }
    },
    legacy_tts: LegacyQueueDetails {
      pending_job_count: cacheable_stats_result.queues.legacy_tts,
    },
  })
}

pub fn render_response_busy(response: GetUnifiedQueueStatsSuccessResponse) -> Result<HttpResponse, GetUnifiedQueueStatsError> {
  let body = render_response_payload(response)?;
  Ok(HttpResponse::TooManyRequests()
      .content_type("application/json")
      .body(body))
}

pub fn render_response_ok(response: GetUnifiedQueueStatsSuccessResponse) -> Result<HttpResponse, GetUnifiedQueueStatsError> {
  let body = render_response_payload(response)?;
  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

pub fn render_response_payload(response: GetUnifiedQueueStatsSuccessResponse) -> Result<String, GetUnifiedQueueStatsError> {
  let body = serde_json::to_string(&response)
      .map_err(|e| {
        error!("error returning response: {:?}",  e);
        GetUnifiedQueueStatsError::ServerError
      })?;
  Ok(body)
}
