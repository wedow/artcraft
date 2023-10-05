#![forbid(private_in_public)]
#![forbid(unused_must_use)]
//#![forbid(warnings)]

#![allow(dead_code)]
#![allow(non_snake_case)]
#![allow(unreachable_patterns)]
#![allow(unused_imports)]
#![allow(unused_mut)]
#![allow(unused_variables)]

#[macro_use] extern crate lazy_static;
#[macro_use] extern crate magic_crypt;
#[macro_use] extern crate serde_derive;

use std::sync::Arc;
use std::thread::sleep;
use std::time::Duration;

use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, web};
use actix_web::middleware::{DefaultHeaders, Logger};
use futures::executor::ThreadPool;
use futures::Future;
use limitation::Limiter;
use log::info;
use r2d2_redis::r2d2;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use tokio::runtime::{Builder, Handle, Runtime};
use twitch_api2::pubsub;
use twitch_api2::pubsub::Topic;
use twitch_oauth2::{AppAccessToken, ClientId, ClientSecret, Scope, tokens::errors::AppAccessTokenError, TwitchToken};
use twitch_oauth2::tokens::UserTokenBuilder;

use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_REDIS_DATABASE_1_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use errors::AnyhowResult;
use http_server_common::cors::build_production_cors_config;
use http_server_common::endpoints::default_route_404::default_route_404;
use http_server_common::endpoints::root_index::get_root_index;
use twitch_common::twitch_secrets::TwitchSecrets;

use crate::endpoints_ws::obs_gateway_websocket_handler::obs_gateway_websocket_handler;
use crate::server_state::{BackendsConfig, EnvConfig, MultithreadingConfig, ObsGatewayServerState, TwitchOauthSecrets};

pub mod endpoints_ws;
pub mod server_state;

const DEFAULT_BIND_ADDRESS : &str = "0.0.0.0:54321";

#[actix_web::main]
//#[tokio::main]
async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  // NB: Do not check this secrets-containing dotenv file into VCS.
  // This file should only contain *development* secrets, never production.
  let _ = dotenv::from_filename(".env-secrets").ok();

  info!("Obtaining hostname...");

  let server_hostname = hostname::get()
      .ok()
      .and_then(|h| h.into_string().ok())
      .unwrap_or("obs-gateway-server-unknown".to_string());

  info!("Hostname: {}", &server_hostname);

  info!("Reading Twitch secrets...");

  let twitch_secrets = TwitchSecrets::from_env()?;

  info!("Reading env vars and setting up utils...");

  let bind_address = easyenv::get_env_string_or_default("BIND_ADDRESS", DEFAULT_BIND_ADDRESS);
  let num_workers = easyenv::get_env_num("NUM_WORKERS", 8)?;
  let hmac_secret = easyenv::get_env_string_or_default("COOKIE_SECRET", "notsecret");
  let cookie_domain = easyenv::get_env_string_or_default("COOKIE_DOMAIN", ".vo.codes");
  let cookie_secure = easyenv::get_env_bool_or_default("COOKIE_SECURE", true);
  let cookie_http_only = easyenv::get_env_bool_or_default("COOKIE_HTTP_ONLY", true);
  let website_homepage_redirect =
      easyenv::get_env_string_or_default("WEBSITE_HOMEPAGE_REDIRECT", "https://vo.codes/");

  let db_connection_string =
      easyenv::get_env_string_or_default(
        "MYSQL_URL",
        DEFAULT_MYSQL_CONNECTION_STRING);

  let redis_connection_string =
      easyenv::get_env_string_or_default(
        "REDIS_1_URL",
        DEFAULT_REDIS_DATABASE_1_CONNECTION_STRING);

  // NB: Redis PubSub doesn't care about Redis DB index number.
  // NB: Note, it's also a bit messy to reuse the "1" index here, since I'm not sure this is the
  //  intention I originally had about separation of concerns.
  let redis_pubsub_connection_string = redis_connection_string.clone();

  info!("Connecting to mysql...");

  let pool = MySqlPoolOptions::new()
      .max_connections(5)
      .connect(&db_connection_string)
      .await?;

  info!("Connecting to redis...");

  let redis_manager = RedisConnectionManager::new(redis_connection_string.clone())?;

  let redis_pool = r2d2::Pool::builder()
      .build(redis_manager)?;

  let runtime = Arc::new(Builder::new_multi_thread()
      .worker_threads(32)
      .thread_name("redis-pubsub-event-consumer-")
      .thread_stack_size(3 * 1024 * 1024)
      .enable_all()
      .build()?);

  let server_state = ObsGatewayServerState {
    hostname: server_hostname,
    env_config: EnvConfig {
      num_workers,
      bind_address,
      cookie_domain,
      cookie_secure,
      cookie_http_only,
      website_homepage_redirect,
    },
    twitch_oauth_secrets: TwitchOauthSecrets {
      client_id: twitch_secrets.app_client_id.clone(),
      client_secret: twitch_secrets.app_client_secret.clone(),
    },
    backends: BackendsConfig {
      mysql_pool: pool,
      redis_pool,
      redis_pubsub_connection_string: redis_connection_string.clone(),
    },
    multithreading: MultithreadingConfig {
      redis_pubsub_runtime: runtime,
    },
  };

  info!("Starting server...");

  serve(server_state).await?;

  Ok(())
}

pub async fn serve(server_state: ObsGatewayServerState) -> AnyhowResult<()>
{
  let bind_address = server_state.env_config.bind_address.clone();
  let num_workers = server_state.env_config.num_workers;
  let hostname = server_state.hostname.clone();

  let server_state_arc = web::Data::new(Arc::new(server_state));

  info!("Starting HTTP service.");

  let log_format = "[%{HOSTNAME}e] %a \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";

  HttpServer::new(move || {
    App::new()
        .app_data(server_state_arc.clone())
        .wrap(build_production_cors_config())
        .wrap(Logger::new(log_format)
            .exclude("/liveness")
            .exclude("/readiness"))
        .wrap(DefaultHeaders::new()
            .header("X-Backend-Hostname", &hostname)
            .header("X-Build-Sha", ""))
        .service(web::resource("/")
            .route(web::get().to(get_root_index))
        )
        // Twitch websocket
        .service(web::resource("/obs/{twitch_username}")
            .route(web::get().to(obs_gateway_websocket_handler))
            .route(web::head().to(HttpResponse::Ok))
        )
        // Local development debugging
        .service(
          actix_files::Files::new("/static", "static")
              .show_files_listing()
              .use_last_modified(true),
        )
    .default_service( web::route().to(default_route_404))
  })
      .bind(bind_address)?
      .workers(num_workers)
      .run()
      .await?;

  Ok(())
}
