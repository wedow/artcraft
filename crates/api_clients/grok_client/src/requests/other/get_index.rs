use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use log::info;
use std::ops::Deref;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, COOKIE, ORIGIN, PRAGMA, REFERER, TE, UPGRADE, USER_AGENT};
use wreq::ws::message::Message;
use wreq::Client;
use wreq_util::Emulation;

// Not even sure what this endpoint just, just testing auth
const INDEX_URL: &str = "https://grok.com";

pub async fn get_index() -> Result<(), GrokError> {
  info!("Building client...");

  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  info!("Configuring client...");

  let cookie = "stblid=f27fe045-ece1-4ebe-ad6f-ff6a79665416";

  let builder = client.get(INDEX_URL)
      .header("User-Agent", FIREFOX_143_MAC_USER_AGENT)
      .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
      .header("Accept-Encoding", "gzip, deflate, br, zstd")
      .header("Accept-Language", "en-US,en;q=0.5")
      .header("Connection", "keep-alive")
      .header("Sec-Fetch-Dest", "document")
      .header("Sec-Fetch-Mode", "navigate")
      .header("Sec-Fetch-Site", "none")
      .header("Sec-Fetch-User", "?1")
      .header("Sec-GPC", "1")
      .header("priority", "u=0, i")
      .header("Pragma", "no-cache")
      .header("Cache-Control", "no-cache")
      .header("Cookie", cookie)
      .header("TE", "trailers");

  info!("Sending...");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let status = response.status();
  println!("Status: {}", status);

  //let body = response.text()
  //    .await
  //    .map_err(|err| GrokGenericApiError::WreqError(err))?;

  // stblid=08552693-0377-49d3-b17f-8e4c68b153ec
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
    let _result = get_index().await;
    assert_eq!(1, 2);
    Ok(())
  }
}
