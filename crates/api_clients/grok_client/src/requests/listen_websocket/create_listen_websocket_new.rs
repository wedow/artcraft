use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::requests::listen_websocket::cookies::SESSION_COOKIES_WITHOUT_CF_CLEARANCE;
use std::ops::Deref;
use std::time::Duration;
use tokio::io::AsyncReadExt;
use wreq::header::USER_AGENT;
use wreq::Client;
use wreq_util::Emulation;

const WEBSOCKET_URL: &str = "wss://grok.com/ws/imagine/listen";

pub async fn create_listen_websocket_new() -> Result<(), GrokError> {
  /*
  Wreq Firefox vs Real Firefox Private Mode:

   - wreq has two extensions real firefox doesn't:
      - "session_ticket (35) (IANA)"
      - "psk_key_exchange_modes (45) (IANA)"
   - wreq has "psk_key_exchange_mode": "AQ==", whereas real firefox private mode is null
   - wreq has "session_ticket_supported": true, whereas real firefox private mode is false

  Wreq Firefox is IDENTICAL to Real Firefox Normal Mode (non-private) mode. - So why is it not working!?
   */
  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10))
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  //.http1_only() // NB: Not needed - websockets are sent over HTTP/1.1 without this configuration
  //.cookie_store(true)

  let builder = client.websocket(WEBSOCKET_URL)
      .header("Accept", "*/*")
      .header("Cookie", SESSION_COOKIES_WITHOUT_CF_CLEARANCE)
      .header("Host", "grok.com")
      .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT);

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
    let _result = create_listen_websocket_new().await;
    log::logger().flush();
    assert_eq!(1, 2);
    Ok(())
  }
}
