use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::listen_websocket::cookies::SESSION_COOKIES_WITHOUT_CF_CLEARANCE;
use cloudflare_mitigation::headers::firefox_websocket_http_1_1_headers::get_firefox_websocket_http_1_1_headers;
use std::ops::Deref;
use std::time::Duration;
use log::info;
use tokio::io::AsyncReadExt;
use wreq::header::{ACCEPT, ACCEPT_LANGUAGE, CACHE_CONTROL, COOKIE, ORIGIN, PRAGMA, SEC_WEBSOCKET_EXTENSIONS, USER_AGENT};
use wreq::{Client, Proxy};
use wreq_util::Emulation;

const WEBSOCKET_URL: &str = "wss://grok.com/ws/imagine/listen";

pub async fn create_listen_websocket_new() -> Result<(), GrokError> {
  let mut client_builder = Client::builder()
      .emulation(Emulation::Firefox143)
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10));

  let client = client_builder
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let builder = client.websocket(WEBSOCKET_URL)
      .default_headers(false)
      .orig_headers(get_firefox_websocket_http_1_1_headers())
      .header(COOKIE, SESSION_COOKIES_WITHOUT_CF_CLEARANCE)
      .header(ORIGIN,"https://grok.com")
      .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT)
      .header(SEC_WEBSOCKET_EXTENSIONS, "permessage-deflate")
      .header(ACCEPT, "*/*")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header("Sec-Fetch-Dest", "empty")
      .header("Sec-Fetch-Mode", "websocket")
      .header("Sec-Fetch-Site", "same-origin")
      .header(PRAGMA, "no-cache")
      .header(CACHE_CONTROL, "no-cache");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let status = response.status();

  info!("WebSocket Response Status: {}", status);

  if !status.is_success() || status.as_u16() != 101 {
  }

  let mut websocket = response.into_websocket()
      .await
      .map_err(|err| GrokGenericApiError::WreqWebsocketUpgradeError(err))?;

  if let Some(protocol) = websocket.protocol() {
    println!("WebSocket subprotocol: {:?}", protocol);
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
    let result = create_listen_websocket_new().await;
    if let Err(err) = result {
      println!("Error: {:?}", err);
    }
    log::logger().flush();
    assert_eq!(1, 2);
    Ok(())
  }
}
