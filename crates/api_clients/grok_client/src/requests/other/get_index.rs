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

pub struct GetIndexArgs<'a> {
  pub cookies: &'a str,
}

pub async fn get_index(args: GetIndexArgs<'_>) -> Result<(), GrokError> {
  println!("Building client...");
  info!("Building client...");

  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Configuring client...");
  info!("Configuring client...");

  let cookies = args.cookies.to_string();

  println!("Cookies: {}", cookies);

  let builder = client.get(INDEX_URL)
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0")
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
      .header("TE", "trailers");
  //.header("Sec-WebSocket-Version", "13")
  //.header("Cookie", cookies)
  //.header("Sec-WebSocket-Extensions", "permessage-deflate")
  //.header(CONNECTION, "keep-alive, Upgrade")
  //.header("Sec-WebSocket-Key", "BhBXbFSG6/1xcZVq4ySxcg==") // TODO
  //.header(ORIGIN, "https://grok.com")
  //.header("Referer", "https://grok.com/imagine")
  //.header("Content-Type", "application/json")
  // TODO: sentry-trace
  // TODO: baggage
  //.header("sentry-trace", "235eb6899dcb507c7993058e7055bf28-b37fd92f38d23c3f-0")
  //.header("baggage", "sentry-environment=production,sentry-public_key=b311e0f2690c81f25e2c4cf6d4f7ce1c,sentry-trace_id=235eb6899dcb507c7993058e7055bf28,sentry-org_id=4508179396558848,sentry-sampled=false,sentry-sample_rand=0.5123249939079335,sentry-sample_rate=0")

  println!("Sending...");
  info!("Sending...");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let status = response.status();
  println!("Status: {}", status);

  let body = response.text()
      .await
      .map_err(|err| GrokGenericApiError::WreqError(err))?;

  println!("Body: {}", body);

  //for (k, v) in response.headers().iter() {
  //  println!("Header: {}: {:?}", k, v);
  //}

  println!("Into websocket...");
  info!("Into websocket...");

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // manually test
  async fn create() -> AnyhowResult<()> {
    let cookies = get_test_cookies()?;
    let args = GetIndexArgs {
      cookies: &cookies,
    };
    let result = get_index(args).await;

    match result {
      Ok(ok) => {
        println!("Okay");
      }
      Err(err) => {
        println!("{:?}", err);
      }
    }

    assert_eq!(1, 2);

    Ok(())
  }
}
