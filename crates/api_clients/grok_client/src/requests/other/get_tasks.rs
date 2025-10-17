use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use log::info;
use std::ops::Deref;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, COOKIE, ORIGIN, PRAGMA, UPGRADE, USER_AGENT};
use wreq::ws::message::Message;
use wreq::Client;
use wreq_util::Emulation;

// Not even sure what this endpoint just, just testing auth
const TASKS_URL: &str = "https://grok.com/rest/tasks";

pub struct TasksArgs<'a> {
  pub cookies: &'a str,
}

pub async fn get_tasks(args: TasksArgs<'_>) -> Result<(), GrokError> {
  println!("Building client...");
  info!("Building client...");

  //let client = Client::builder()
  //    .emulation(Emulation::Firefox139)
  //    .build()
  //    .map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Configuring client...");
  info!("Configuring client...");

  let builder = wreq::get(TASKS_URL)
      .header(ACCEPT, "*/*")
      .header(USER_AGENT, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(ORIGIN, "https://grok.com")
      //.header("Sec-WebSocket-Version", "13")
      //.header("Sec-WebSocket-Extensions", "permessage-deflate")
      //.header("Sec-WebSocket-Key", "BhBXbFSG6/1xcZVq4ySxcg==") // TODO
      //.header("Sec-GPC", "1")
      //.header(CONNECTION, "keep-alive, Upgrade")
      .header(COOKIE, args.cookies.to_string())
      //.header("Sec-Fetch-Dest", "empty")
      //.header("Sec-Fetch-Mode", "websocket")
      //.header("Sec-Fetch-Site", "same-origin")
      .header(PRAGMA, "no-cache")
      .header(CACHE_CONTROL, "no-cache");

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

  //println!("Upgrading...");
  //info!("Upgrading...");
  //let upgraded = response
  //    .upgrade()
  //    .await
  //    .map_err(|err| GrokClientError::WreqClientError(err))?;


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
    let args = TasksArgs {
      cookies: &cookies,
    };
    let result = get_tasks(args).await;

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
