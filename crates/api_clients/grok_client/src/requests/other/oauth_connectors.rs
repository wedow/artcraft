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
const OAUTH_CONNECTORS_URL: &str = "https://grok.com/api/oauth-connectors";

pub struct OauthConnectorsArgs<'a> {
  pub cookies: &'a str,
}

pub async fn get_oauth_connectors(args: OauthConnectorsArgs<'_>) -> Result<(), GrokError> {
  println!("Building client...");
  info!("Building client...");

  let client = Client::builder()
      .emulation(Emulation::Firefox139)
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Configuring client...");
  info!("Configuring client...");

  let builder = client.get(OAUTH_CONNECTORS_URL)
      .header(ACCEPT, "*/*")
      .header(USER_AGENT, "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(ORIGIN, "https://grok.com")
      .header(REFERER, "https://grok.com/imagine")
      .header(CONTENT_TYPE, "application/json")
      // TODO: sentry-trace
      // TODO: baggage
      .header(CONNECTION, "keep-alive")
      .header(COOKIE, args.cookies.to_string())
      //.header(CONNECTION, "keep-alive, Upgrade")
      .header("Sec-GPC", "1")
      .header("Sec-Fetch-Dest", "empty")
      .header("Sec-Fetch-Mode", "cors")
      .header("Sec-Fetch-Site", "same-origin")
      .header("priority", "u=4")
      .header(PRAGMA, "no-cache")
      .header(TE, "trailers");
  //.header("Sec-WebSocket-Version", "13")
  //.header("Sec-WebSocket-Extensions", "permessage-deflate")
  //.header("Sec-WebSocket-Key", "BhBXbFSG6/1xcZVq4ySxcg==") // TODO

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
    let args = OauthConnectorsArgs {
      cookies: &cookies,
    };
    let result = get_oauth_connectors(args).await;

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
