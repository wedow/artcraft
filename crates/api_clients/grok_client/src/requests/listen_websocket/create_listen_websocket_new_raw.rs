use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::requests::listen_websocket::cookies::SESSION_COOKIES_WITHOUT_CF_CLEARANCE;
use std::ops::Deref;
use std::time::Duration;
use tokio::io::AsyncReadExt;
use wreq::header::{HeaderMap, HeaderName, ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, COOKIE, HOST, ORIGIN, PRAGMA, SEC_WEBSOCKET_EXTENSIONS, SEC_WEBSOCKET_KEY, SEC_WEBSOCKET_VERSION, UPGRADE, USER_AGENT};
use wreq::{Client, Proxy, Version};
use wreq_util::Emulation;

const WEBSOCKET_HTTPS_URL: &str = "https://grok.com/ws/imagine/listen";

pub async fn create_listen_websocket_new_raw() -> Result<(), GrokError> {
  /*
  Wreq Firefox vs Real Firefox Private Mode:

   - wreq has two extensions real firefox doesn't:
      - "session_ticket (35) (IANA)"
      - "psk_key_exchange_modes (45) (IANA)"
   - wreq has "psk_key_exchange_mode": "AQ==", whereas real firefox private mode is null
   - wreq has "session_ticket_supported": true, whereas real firefox private mode is false

  Wreq Firefox is IDENTICAL to Real Firefox Normal Mode (non-private) mode. - So why is it not working!?
   */

  let mut client_builder = Client::builder()
      .emulation(Emulation::Firefox143)
      .default_headers(HeaderMap::new())
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10));

  let mut proxy = None;

  //proxy = Some(Proxy::https("http://127.0.0.1:8080")
  //    .map_err(|err| GrokClientError::WreqClientError(err))?);

  if let Some(proxy) = proxy {
    client_builder = client_builder
        .cert_verification(false)
        .proxy(proxy);
  }

  let client = client_builder
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  //.http1_only() // NB: Not needed - websockets are sent over HTTP/1.1 without this configuration
  //.cookie_store(true)

  // NB: Sending a normal GET request seems to punch through Cloudflare and get a 400 instead
  let builder = client.get(WEBSOCKET_HTTPS_URL)
      .version(Version::HTTP_11)
      .default_headers(false)
      .header(HOST, "grok.com")
      .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT)
      .header(ACCEPT, "*/*")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(SEC_WEBSOCKET_VERSION, 13)
      .header(ORIGIN,"https://grok.com")
      .header(SEC_WEBSOCKET_EXTENSIONS, "permessage-deflate")
      .header(SEC_WEBSOCKET_KEY, "X2NHDjwqbk4quToBT5L97Q==")
      .header(CONNECTION, "keep-alive, Upgrade")
      .header(COOKIE, SESSION_COOKIES_WITHOUT_CF_CLEARANCE)
      .header("Sec-Fetch-Dest", "empty")
      .header("Sec-Fetch-Mode", "websocket")
      .header("Sec-Fetch-Site", "same-origin")
      .header(PRAGMA, "no-cache")
      .header(CACHE_CONTROL, "no-cache")
      .header(UPGRADE, "websocket")
      ;

  // TODO: Connect: keep-alive --> keep-alive, Upgrade
  // TODO: Accept-Encoding: "gzip, deflate, br, zstd"
  // TODO: Camel case header names
  // TODO: Header orders!

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Response version: {:?}", response.version());

  let status = response.status();
  println!("Status: {}", status);

  for cookie in response.cookies() {
    println!("Cookie: {}={}", cookie.name(), cookie.value());
  }

  for (name, value) in response.headers() {
    println!("Header: {}: {}", name.as_str(), value.to_str().unwrap());
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // manually test
  async fn create() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let result = create_listen_websocket_new_raw().await;
    if let Err(err) = result {
      println!("Error: {:?}", err);
    }
    log::logger().flush();
    assert_eq!(1, 2);
    Ok(())
  }
}
