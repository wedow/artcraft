// Never allow these
#![forbid(private_in_public)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
//#![forbid(warnings)]
#![allow(unreachable_patterns)]
#![allow(unused_imports)]
#![allow(unused_mut)]
#![allow(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[macro_use] extern crate lazy_static;
#[macro_use] extern crate magic_crypt;
#[macro_use] extern crate serde_derive;

pub const RESERVED_USERNAMES : &'static str = include_str!("../../../../../db/reserved_usernames.txt");
pub const RESERVED_SUBSTRINGS : &'static str = include_str!("../../../../../db/reserved_usernames_including.txt");

pub mod billing;
pub mod configs;
pub mod http_server;
pub mod model;
pub mod routes;
pub mod server_state;
pub mod subscriptions;
pub mod threads;
pub mod util;
pub mod validations;

// TODO: Eventually move all of these to the `database_queries` crate and no longer write inline MySQL.
// NB: Also so sqlx codegens everything.
// Not sure if this is strictly necessary.
mod shared_queries {
  use database_queries::queries::twitch::twitch_oauth::find;
  use database_queries::queries::twitch::twitch_oauth::insert;
}

use actix_cors::Cors;
use actix_helpers::middleware::ip_filter::ip_ban_list::ip_ban_list::IpBanList;
use actix_helpers::middleware::ip_filter::ip_ban_list::load_ip_ban_list_from_directory::load_ip_ban_list_from_directory;
use actix_helpers::middleware::ip_filter::ip_filter_middleware::IpFilter;
use actix_http::http;
use actix_web::middleware::{Logger, DefaultHeaders};
use actix_web::{HttpServer, web, HttpResponse, App, middleware};
use anyhow::anyhow;
use billing_component::stripe::stripe_config::{FullUrlOrPath, StripeCheckoutConfigs, StripeConfig, StripeCustomerPortalConfigs, StripeSecrets};
use billing_component::stripe::traits::internal_product_to_stripe_lookup::InternalProductToStripeLookup;
use billing_component::stripe::traits::internal_subscription_product_lookup::InternalSubscriptionProductLookup;
use billing_component::stripe::traits::internal_user_lookup::InternalUserLookup;
use cloud_storage::bucket_client::BucketClient;
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use container_common::files::read_toml_file_to_struct::read_toml_file_to_struct;
use crate::billing::internal_product_to_stripe_lookup_impl::InternalProductToStripeLookupImpl;
use crate::billing::stripe_internal_subscription_product_lookup_impl::StripeInternalSubscriptionProductLookupImpl;
use crate::billing::stripe_internal_user_lookup_impl::StripeInternalUserLookupImpl;
use crate::configs::static_api_tokens::{StaticApiTokenConfig, StaticApiTokens, StaticApiTokenSet};
use crate::http_server::middleware::pushback_filter_middleware::PushbackFilter;
use crate::http_server::web_utils::redis_rate_limiter::RedisRateLimiter;
use crate::routes::add_routes;
use crate::server_state::{ServerState, EnvConfig, TwitchOauthSecrets, TwitchOauth, RedisRateLimiters, InMemoryCaches, StripeSettings, ServerInfo, StaticFeatureFlags};
use crate::threads::db_health_checker_thread::db_health_check_status::HealthCheckStatus;
use crate::threads::db_health_checker_thread::db_health_checker_thread::db_health_checker_thread;
use crate::threads::poll_ip_banlist_thread::poll_ip_bans;
use crate::util::encrypted_sort_id::SortKeyCrypto;
use database_queries::mediators::badge_granter::BadgeGranter;
use database_queries::mediators::firehose_publisher::FirehosePublisher;
use errors::AnyhowResult;
use futures::Future;
use http_server_common::cors::{build_cors_config, build_production_cors_config};
use limitation::Limiter;
use log::{error, info};
use memory_caching::single_item_ttl_cache::SingleItemTtlCache;
use r2d2_redis::RedisConnectionManager;
use r2d2_redis::r2d2;
use r2d2_redis::redis::Commands;
use reusable_types::server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use sqlx::mysql::MySqlPoolOptions;
use std::sync::Arc;
use std::time::Duration;
use tokio::runtime::Runtime;
use actix_helpers::middleware::endpoint_disablement::disabled_endpoints::disabled_endpoints::DisabledEndpoints;
use actix_helpers::middleware::endpoint_disablement::disabled_endpoints::exact_match_endpoint_disablements::ExactMatchEndpointDisablements;
use actix_helpers::middleware::endpoint_disablement::disabled_endpoints::prefix_endpoint_disablements::PrefixEndpointDisablements;
use actix_helpers::middleware::endpoint_disablement::endpoint_disablement_middleware::EndpointDisablementFilter;
use twitch_common::twitch_secrets::TwitchSecrets;
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;
use users_component::utils::session_checker::SessionChecker;
use users_component::utils::session_cookie_manager::SessionCookieManager;

const DEFAULT_BIND_ADDRESS : &'static str = "0.0.0.0:12345";

// Buckets (shared config)
const ENV_ACCESS_KEY : &'static str = "ACCESS_KEY";
const ENV_SECRET_KEY : &'static str = "SECRET_KEY";
const ENV_REGION_NAME : &'static str = "REGION_NAME";

// Buckets (private data)
const ENV_PRIVATE_BUCKET_NAME : &'static str = "W2L_PRIVATE_DOWNLOAD_BUCKET_NAME";
// Buckets (public data)
const ENV_PUBLIC_BUCKET_NAME : &'static str = "W2L_PUBLIC_DOWNLOAD_BUCKET_NAME";

// Various bucket roots
const ENV_AUDIO_UPLOADS_BUCKET_ROOT : &'static str = "AUDIO_UPLOADS_BUCKET_ROOT";

#[actix_web::main]
async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  // NB: Do not check this secrets-containing dotenv file into VCS.
  // This file should only contain *development* secrets, never production.
  let _ = dotenv::from_filename(".env-secrets").ok();

  let common_env = CommonEnv::read_from_env()?;

  info!("Obtaining hostname...");

  let server_hostname = hostname::get()
    .ok()
    .and_then(|h| h.into_string().ok())
    .unwrap_or("storyteller-web-unknown".to_string());

  info!("Hostname: {}", &server_hostname);

  info!("Connecting to database...");

  let db_connection_string =
    easyenv::get_env_string_or_default(
      "MYSQL_URL",
      DEFAULT_MYSQL_CONNECTION_STRING);

  let pool = MySqlPoolOptions::new()
    .max_connections(easyenv::get_env_num("MYSQL_MAX_CONNECTIONS", 5)?)
    .connect(&db_connection_string)
    .await?;

  let firehose_publisher = FirehosePublisher {
    mysql_pool: pool.clone(), // NB: Pool is clone/sync/send-safe
  };

  let badge_granter = BadgeGranter {
    mysql_pool: pool.clone(), // NB: Pool is clone/sync/send-safe
    firehose_publisher: firehose_publisher.clone(), // NB: Also safe
  };

  let redis_manager = RedisConnectionManager::new(
    common_env.redis_0_connection_string.clone())?;

  let redis_pool = r2d2::Pool::builder()
      .build(redis_manager)?;

  info!("Setting up Redis rate limiters...");

  // Old env vars:
  //
  // "LIMITER_ENABLED"
  // "LIMITER_MAX_REQUESTS"
  // "LIMITER_WINDOW_SECONDS"
  //
  let logged_out_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_LOGGED_OUT_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_LOGGED_OUT_MAX_REQUESTS", 3)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_LOGGED_OUT_WINDOW_SECONDS", 10)?;

    let limiter = Limiter::build(&common_env.redis_0_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "logged_out", limiter_enabled)
  };

  let logged_in_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_LOGGED_IN_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_LOGGED_IN_MAX_REQUESTS", 3)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_LOGGED_IN_WINDOW_SECONDS", 10)?;

    let limiter = Limiter::build(&common_env.redis_0_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "logged_in", limiter_enabled)
  };

  let api_high_priority_redis_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_API_HIGH_PRIORITY_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_API_HIGH_PRIORITY_MAX_REQUESTS", 30)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_API_HIGH_PRIORITY_WINDOW_SECONDS", 30)?;

    let limiter = Limiter::build(&common_env.redis_0_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "api_high_priority", limiter_enabled)
  };

  let model_upload_rate_limiter = {
    let limiter_enabled = easyenv::get_env_bool_or_default("LIMITER_MODEL_UPLOAD_ENABLED", true);
    let limiter_max_requests = easyenv::get_env_num("LIMITER_MODEL_UPLOAD_MAX_REQUESTS", 3)?;
    let limiter_window_seconds = easyenv::get_env_num("LIMITER_MODEL_UPLOAD_WINDOW_SECONDS", 10)?;

    let limiter = Limiter::build(&common_env.redis_0_connection_string)
        .limit(limiter_max_requests)
        .period(Duration::from_secs(limiter_window_seconds))
        .finish()?;

    RedisRateLimiter::new(limiter, "model_upload", limiter_enabled)
  };

  info!("Reading env vars and setting up utils...");

  let bind_address = easyenv::get_env_string_or_default("BIND_ADDRESS", DEFAULT_BIND_ADDRESS);
  let num_workers = easyenv::get_env_num("NUM_WORKERS", 8)?;
  let hmac_secret = easyenv::get_env_string_or_default("COOKIE_SECRET", "notsecret");
  let cookie_domain = easyenv::get_env_string_or_default("COOKIE_DOMAIN", ".vo.codes");
  let cookie_secure = easyenv::get_env_bool_or_default("COOKIE_SECURE", true);
  let cookie_http_only = easyenv::get_env_bool_or_default("COOKIE_HTTP_ONLY", true);
  let website_homepage_redirect =
      easyenv::get_env_string_or_default("WEBSITE_HOMEPAGE_REDIRECT", "https://vo.codes/");

  let cookie_manager = SessionCookieManager::new(&cookie_domain, &hmac_secret);
  let session_checker = SessionChecker::new(&cookie_manager);

  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;

  // Private and Public Buckets
  let private_bucket_name = easyenv::get_env_string_required(ENV_PRIVATE_BUCKET_NAME)?;
  let public_bucket_name = easyenv::get_env_string_required(ENV_PUBLIC_BUCKET_NAME)?;

  // Bucket roots
  let audio_uploads_bucket_root= easyenv::get_env_string_required(ENV_AUDIO_UPLOADS_BUCKET_ROOT)?;

  let bucket_timeout = easyenv::get_env_duration_seconds_or_default("BUCKET_TIMEOUT_SECONDS",
    Duration::from_secs(60 * 5));

  let private_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &private_bucket_name,
    None,
    Some(bucket_timeout),
  )?;

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    None,
    Some(bucket_timeout),
  )?;

  // In-Memory Cache
  let voice_list_cache_ttl = easyenv::get_env_duration_seconds_or_default("VOICE_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60));
  let category_list_cache_ttl = easyenv::get_env_duration_seconds_or_default("CATEGORY_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60));
  let voice_list_cache = SingleItemTtlCache::create_with_duration(voice_list_cache_ttl);

  let database_tts_category_list_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("DATABASE_TTS_CATEGORY_LIST_CACHE_TTL_SECONDS", Duration::from_secs(60))
  );

  let w2l_template_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("W2L_TEMPLATE_LIST_CACHE_TTL_SECONDS", Duration::from_secs(300)) // 5 minutes
  );

  let tts_queue_length_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("TTS_QUEUE_LENGTH_CACHE_TTL_SECONDS", Duration::from_secs(30))
  );

  let tts_model_category_assignments_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("TTS_MODEL_CATEGORY_ASSIGNMENTS_CACHE_TTL_SECONDS", Duration::from_secs(60))
  );

  let leaderboard_cache = SingleItemTtlCache::create_with_duration(
    easyenv::get_env_duration_seconds_or_default("LEADERBOARD_CACHE_TTL_SECONDS", Duration::from_secs(60))
  );

  // NB: This secret really isn't too important.
  // We can even rotate it without too much impact to users.
  let sort_key_crypto_secret =
      easyenv::get_env_string_or_default("SORT_KEY_SECRET", "webscale");
  let sort_key_crypto = SortKeyCrypto::new(&sort_key_crypto_secret);

  let twitch_oauth_redirect_landing_url = easyenv::get_env_string_or_default(
    "TWITCH_OAUTH_REDIRECT_LANDING_URL",
    "https://api.jungle.horse/twitch/oauth/enroll_redirect_landing");

  let twitch_oauth_redirect_landing_finished_url = easyenv::get_env_string_or_default(
    "TWITCH_OAUTH_REDIRECT_LANDING_FINISHED_URL",
    "https://jungle.horse/");

  let twitch_secrets = TwitchSecrets::from_env()?;

  let health_check_interval = easyenv::get_env_duration_seconds_or_default(
    "HEALTH_CHECK_INTERVAL_SECS", Duration::from_secs(3));

  let static_api_token_set = read_static_api_tokens();

  let ip_ban_list = load_static_container_ip_bans();
  let ip_ban_list2 = ip_ban_list.clone();

  // Background jobs.

  let health_check_status = HealthCheckStatus::new();
  let health_check_status2 = health_check_status.clone();
  let mysql_pool3 = pool.clone();
  let mysql_pool4 = pool.clone();

  let tokio_runtime = Runtime::new()?;

  info!("Spawning DB health checker thread.");

  tokio_runtime.spawn(async move {
    db_health_checker_thread(
      health_check_status2,
      mysql_pool3,
      health_check_interval,
    ).await;
  });

  info!("Spawning IP ban polling thread.");

  tokio_runtime.spawn(async {
    poll_ip_bans(ip_ban_list2, mysql_pool4).await;
  });

  let stripe_configs = StripeConfig {
    checkout: StripeCheckoutConfigs {
      success_url: FullUrlOrPath::Path(easyenv::get_env_string_required("STRIPE_CHECKOUT_SUCCESS_URL_PATH")?),
      cancel_url: FullUrlOrPath::Path(easyenv::get_env_string_required("STRIPE_CHECKOUT_CANCEL_URL_PATH")?),
    },
    portal: StripeCustomerPortalConfigs {
      return_url: FullUrlOrPath::Path(easyenv::get_env_string_required("STRIPE_PORTAL_RETURN_URL_PATH")?),
      default_portal_config_id: easyenv::get_env_string_required("STRIPE_PORTAL_DEFAULT_CONFIG_ID")?,
    },
    secrets: StripeSecrets {
      publishable_key: easyenv::get_env_string_optional("STRIPE_PUBLISHABLE_KEY"),
      secret_key: easyenv::get_env_string_required("STRIPE_SECRET_KEY")?,
      secret_webhook_signing_key: easyenv::get_env_string_required("STRIPE_SECRET_WEBHOOK_SIGNING_KEY")?,
    },
  };

  let server_environment = ServerEnvironment::from_str(&easyenv::get_env_string_required("SERVER_ENVIRONMENT")?)
      .ok_or(anyhow!("invalid server environment"))?;

  let service_feature_flags = StaticFeatureFlags {
    global_429_pushback_filter_enabled: easyenv::get_env_bool_or_default("FF_GLOBAL_429_PUSHBACK_FILTER_ENABLED", false),
    disable_tts_queue_length_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_TTS_QUEUE_LENGTH_ENDPOINT", false),
    disable_tts_model_list_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_TTS_MODEL_LIST_ENDPOINT", false),
    frontend_pending_tts_refresh_interval_millis: easyenv::get_env_num("FF_FRONTEND_PENDING_TTS_REFRESH_INTERVAL_MILLIS", 15_000)?,
  };

  let third_party_url_redirector = ThirdPartyUrlRedirector::new(server_environment);

  let stripe_client = {
    let api_secret = stripe_configs.secrets.secret_key.clone();
    stripe::Client::new(api_secret)
  };

  // NB: Docker creates this file within container builds.
  let build_sha = std::fs::read_to_string("/GIT_SHA")
      .unwrap_or(String::from("unknown"))
      .trim()
      .to_string();

  let server_state = ServerState {
    env_config: EnvConfig {
      num_workers,
      bind_address,
      cookie_domain,
      cookie_secure,
      cookie_http_only,
      website_homepage_redirect,
    },
    server_info: ServerInfo {
      build_sha,
    },
    stripe: StripeSettings {
      config: stripe_configs,
      client: stripe_client,
    },
    hostname: server_hostname,
    server_environment,
    flags: service_feature_flags,
    third_party_url_redirector,
    health_check_status,
    mysql_pool: pool,
    redis_pool,
    redis_rate_limiters: RedisRateLimiters {
      logged_out: logged_out_redis_rate_limiter,
      logged_in: logged_in_redis_rate_limiter,
      api_high_priority: api_high_priority_redis_rate_limiter,
      model_upload: model_upload_rate_limiter,
    },
    firehose_publisher,
    badge_granter,
    cookie_manager,
    session_checker,
    private_bucket_client,
    public_bucket_client,
    audio_uploads_bucket_root,
    sort_key_crypto,
    static_api_token_set,
    caches: InMemoryCaches {
      voice_list: voice_list_cache,
      w2l_template_list: w2l_template_cache,
      database_tts_category_list: database_tts_category_list_cache,
      tts_queue_length: tts_queue_length_cache,
      tts_model_category_assignments: tts_model_category_assignments_cache,
      leaderboard: leaderboard_cache,
    },
    twitch_oauth: TwitchOauth {
      secrets: TwitchOauthSecrets {
        client_id: twitch_secrets.app_client_id,
        client_secret: twitch_secrets.app_client_secret,
      },
      redirect_landing_url: twitch_oauth_redirect_landing_url,
      redirect_landing_finished_url: twitch_oauth_redirect_landing_finished_url,
    },
    ip_ban_list,
  };

  serve(server_state)
    .await?;
  Ok(())
}

fn read_static_api_tokens() -> StaticApiTokenSet {
  let filename = easyenv::get_env_string_or_default(
    "STATIC_API_TOKENS_CONFIG_FILE",
    "./configs/static_api_tokens.toml");

  StaticApiTokenSet::from_file(&filename)
}

fn read_endpoint_disablements() -> DisabledEndpoints {
  let exact_filename = easyenv::get_env_string_or_default(
    "DISABLED_ENDPOINTS_FILE_EXACT_MATCH",
    "./container_includes/endpoint_disablement/endpoint_exact_matches.txt");

  let exact = ExactMatchEndpointDisablements::load_from_file(exact_filename)
      .unwrap_or(ExactMatchEndpointDisablements::new()); // NB: Fail open

  let prefix_filename = easyenv::get_env_string_or_default(
    "DISABLED_ENDPOINTS_FILE_PREFIX_MATCH",
    "./container_includes/endpoint_disablement/endpoint_prefixes.txt");

  let prefix = PrefixEndpointDisablements::load_from_file(prefix_filename)
      .unwrap_or(PrefixEndpointDisablements::new()); // NB: Fail open

  DisabledEndpoints::new(exact, prefix)
}

fn load_static_container_ip_bans() -> IpBanList {
  let ip_ban_directory = easyenv::get_env_string_or_default(
    "IP_BAN_DIRECTORY",
    "./container_includes/ip_bans"
  );

  let ip_ban_list = load_ip_ban_list_from_directory(ip_ban_directory)
      .unwrap_or(IpBanList::new());

  info!("Static IP bans loaded: {}", ip_ban_list.total_len().unwrap_or(0));
  ip_ban_list
}

pub async fn serve(server_state: ServerState) -> AnyhowResult<()>
{
  let bind_address = server_state.env_config.bind_address.clone();
  let num_workers = server_state.env_config.num_workers.clone();
  let hostname = server_state.hostname.clone();

  let server_state_arc = web::Data::new(Arc::new(server_state));

  let disablements = read_endpoint_disablements();

  info!("Starting HTTP service.");

  //let log_format = "[%{HOSTNAME}e] %a \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";
  let log_format = "[%{HOSTNAME}e] IP=[%{X-Forwarded-For}i] \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";

  HttpServer::new(move || {
    // NB: Safe to clone due to internal arc
    let ip_ban_list = server_state_arc.ip_ban_list.clone();

    // NB: Dynamic dispatch needs to be wrapped with Arc.
    let product_lookup : Arc<dyn InternalSubscriptionProductLookup> = Arc::new(StripeInternalSubscriptionProductLookupImpl {});
    let stripe_lookup : Arc<dyn InternalProductToStripeLookup> = Arc::new(InternalProductToStripeLookupImpl{});
    let user_lookup : Arc<dyn InternalUserLookup> = Arc::new(StripeInternalUserLookupImpl::new(
      server_state_arc.session_checker.clone(),
      server_state_arc.mysql_pool.clone(),
    ));

    // NB: app_data being clone()'d below should all be safe (dependencies included)
    let app = App::new()
      .app_data(web::Data::new(server_state_arc.firehose_publisher.clone()))
      .app_data(web::Data::new(server_state_arc.mysql_pool.clone()))
      .app_data(web::Data::new(server_state_arc.redis_pool.clone()))
      .app_data(web::Data::new(server_state_arc.session_checker.clone()))
      .app_data(web::Data::new(server_state_arc.cookie_manager.clone()))
      .app_data(web::Data::new(server_state_arc.stripe.clone().config.clone()))
      .app_data(web::Data::new(server_state_arc.stripe.clone().client.clone()))
      .app_data(web::Data::new(server_state_arc.third_party_url_redirector.clone()))
      .app_data(web::Data::new(server_state_arc.server_environment.clone()))
      .app_data(web::Data::from(product_lookup)) // NB: Data::from(Arc<T>) for dynamic dispatch
      .app_data(web::Data::from(stripe_lookup)) // NB: Data::from(Arc<T>) for dynamic dispatch
      .app_data(web::Data::from(user_lookup)) // NB: Data::from(Arc<T>) for dynamic dispatch
      .app_data(server_state_arc.clone())
      .wrap(build_cors_config(server_state_arc.server_environment.clone()))
      .wrap(DefaultHeaders::new()
        .header("X-Backend-Hostname", &hostname)
        .header("X-Build-Sha", server_state_arc.server_info.build_sha.clone()))
      .wrap(PushbackFilter::new(&server_state_arc.flags.clone()))
      .wrap(EndpointDisablementFilter::new(disablements.clone()))
      .wrap(IpFilter::new(ip_ban_list))
      .wrap(Logger::new(&log_format)
        .exclude("/liveness")
        .exclude("/readiness"))
      .wrap(middleware::Compress::default());

    add_routes(app)
  })
  .bind(bind_address)?
  .workers(num_workers)
  .run()
  .await?;

  Ok(())
}
