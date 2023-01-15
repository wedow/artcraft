use billing_component::stripe::stripe_config::StripeConfig;
use cloud_storage::bucket_client::BucketClient;
use crate::StaticApiTokenSet;
use crate::http_server::endpoints::categories::list_tts_categories::DisplayCategory;
use crate::http_server::endpoints::tts::list_tts_models::TtsModelRecordForResponse;
use crate::http_server::web_utils::redis_rate_limiter::RedisRateLimiter;
use crate::threads::db_health_checker_thread::db_health_check_status::HealthCheckStatus;
use crate::threads::ip_banlist_set::IpBanlistSet;
use crate::util::encrypted_sort_id::SortKeyCrypto;
use database_queries::mediators::badge_granter::BadgeGranter;
use database_queries::mediators::firehose_publisher::FirehosePublisher;
use database_queries::queries::tts::tts_inference_jobs::get_pending_tts_inference_job_count::TtsQueueLengthResult;
use database_queries::queries::w2l::w2l_templates::list_w2l_templates::W2lTemplateRecordForList;
use memory_caching::single_item_ttl_cache::SingleItemTtlCache;
use r2d2_redis::{r2d2, RedisConnectionManager};
use reusable_types::server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;
use users_component::utils::session_checker::SessionChecker;
use users_component::utils::crypted_cookie_manager::CryptedCookieManager;
use users_component::utils::session_cookie_manager::SessionCookieManager;

/// State that is injected into every endpoint.
pub struct ServerState {
  /// Configuration from ENV vars.
  pub env_config: EnvConfig,

  pub stripe: StripeSettings,

  pub hostname: String,

  /// Knowing if we're in production will allow us to turn off development-only functionalities.
  pub server_environment: ServerEnvironment,

  pub third_party_url_redirector: ThirdPartyUrlRedirector,

  pub health_check_status: HealthCheckStatus,

  pub mysql_pool: MySqlPool,

  pub redis_pool: r2d2::Pool<RedisConnectionManager>,

  pub redis_rate_limiters: RedisRateLimiters,

  pub ccm: CryptedCookieManager,

  pub cookie_manager: SessionCookieManager,

  pub session_checker: SessionChecker,

  pub firehose_publisher: FirehosePublisher,
  pub badge_granter: BadgeGranter,

  pub private_bucket_client: BucketClient,
  pub public_bucket_client: BucketClient,

  /// Where to store audio uploads for w2l
  pub audio_uploads_bucket_root: String,

  pub sort_key_crypto: SortKeyCrypto,

  pub ip_banlist: IpBanlistSet,

  pub static_api_token_set: StaticApiTokenSet,

  pub caches: InMemoryCaches,

  pub twitch_oauth: TwitchOauth,
}

#[derive(Clone)]
pub struct EnvConfig {
  // Number of thread workers.
  pub num_workers: usize,
  pub bind_address: String,
  pub cookie_domain: String,
  pub cookie_secure: bool,
  pub cookie_http_only: bool,
  pub website_homepage_redirect: String,
}

/// Necessary to run the OAuth flow.
#[derive(Clone)]
pub struct TwitchOauth {
  pub secrets: TwitchOauthSecrets,
  pub redirect_landing_url: String,
  pub redirect_landing_finished_url: String,
}

/// Necessary to run the OAuth flow.
#[derive(Clone)]
pub struct TwitchOauthSecrets {
  pub client_id: String,
  pub client_secret: String,
}

/// Different rate limiters for different users
#[derive(Clone)]
pub struct RedisRateLimiters {
  /// Logged out users have stricter limits
  pub logged_out: RedisRateLimiter,

  /// Logged in users have a little more leeway
  pub logged_in: RedisRateLimiter,

  /// API consumers have even higher priority
  /// (Temporary for VidVoice.ai; a long term solution builds an in-memory cache
  /// of these or finds a better rate limit library that allows on-demand rate
  /// constructions)
  pub api_high_priority: RedisRateLimiter,

  /// A rate limiter for TTS and W2L uploads
  pub model_upload: RedisRateLimiter,
}

/// In-memory caches
#[derive(Clone)]
pub struct InMemoryCaches {
  /// In-memory caches with TTL-based eviction. Contains a list of all voices.
  pub voice_list: SingleItemTtlCache<Vec<TtsModelRecordForResponse>>,

  /// Contains a list of all W2L templates.
  pub w2l_template_list: SingleItemTtlCache<Vec<W2lTemplateRecordForList>>,

  /// In-memory caches with TTL-based eviction. Contains a list of all TTS categories.
  pub category_list: SingleItemTtlCache<Vec<DisplayCategory>>,

  /// TTS queue length
  /// The frontend will consult a distributed cache and use the monotonic DB time as a
  /// vector clock.
  pub tts_queue_length: SingleItemTtlCache<TtsQueueLengthResult>,
}

#[derive(Clone)]
pub struct StripeSettings {
  pub config: StripeConfig,
  pub client: stripe::Client,
}
