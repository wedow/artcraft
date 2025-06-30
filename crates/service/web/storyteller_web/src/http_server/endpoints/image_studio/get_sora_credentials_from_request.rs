use actix_web::HttpRequest;
use anyhow::anyhow;
use errors::AnyhowResult;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use log::{error, info};
use openai_sora_client::credentials::SoraCredentials;
use r2d2_redis::r2d2::PooledConnection;
use r2d2_redis::RedisConnectionManager;
use shared_service_components::sora_redis_credentials::get_sora_credentials_from_redis::get_sora_credentials_from_redis;

const SORA_BEARER_HEADER_NAME : &str = "sora-bearer";
const SORA_COOKIE_HEADER_NAME : &str = "sora-cookie";
const SORA_SENTINEL_HEADER_NAME : &str = "sora-sentinel";

pub fn get_sora_credentials_from_request(
  http_request: &HttpRequest,
  redis: &mut PooledConnection<RedisConnectionManager>,
) -> AnyhowResult<SoraCredentials> {

  let sora_bearer = get_request_header_optional(&http_request, SORA_BEARER_HEADER_NAME);
  let sora_cookie = get_request_header_optional(&http_request, SORA_COOKIE_HEADER_NAME);
  let sora_sentinel = get_request_header_optional(&http_request, SORA_SENTINEL_HEADER_NAME);

  match (&sora_bearer, &sora_cookie, &sora_sentinel) {
    (Some(bearer), Some(cookie), Some(sentinel)) => {
      info!("Sora credentials were present in HTTP request headers!");

      return Ok(SoraCredentials {
        bearer_token: bearer.to_string(),
        cookie: cookie.to_string(),
        sentinel: Some(sentinel.to_string()),
      });
    }
    _ => {} // Fall through
  }

  let redis_result = get_sora_credentials_from_redis(redis);

  match redis_result {
    Ok(mut credentials) => {
      if let Some(bearer) = sora_bearer {
        info!("override bearer value");
        credentials.bearer_token = bearer;
      }
      if let Some(cookie) = sora_cookie {
        info!("override cookie value");
        credentials.cookie = cookie;
      }
      if let Some(sentinel) = sora_sentinel {
        info!("override sentinel value");
        credentials.sentinel = Some(sentinel);
      }
      return Ok(credentials)
    },
    Err(err) => {
      error!("Failed to get Sora credentials from Redis; using env as backup. Error: {:?}", err);
      // NB: Fall through
    }
  };

  match SoraCredentials::from_env() {
    Ok(creds) => Ok(creds),
    Err(err) => {
      error!("Failed to load Sora credentials from environment: {:?}", err);
      Err(anyhow!("Failed to load Sora credentials from environment"))
    }
  }
}
