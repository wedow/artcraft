use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use log::info;
use std::ops::Deref;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, COOKIE, ORIGIN, PRAGMA, UPGRADE, USER_AGENT};
use wreq::ws::message::Message;
use wreq::Client;
use wreq_util::Emulation;
use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;

// Not even sure what this endpoint just, just testing auth
const TASKS_URL: &str = "https://grok.com/rest/tasks";

pub struct TasksArgs<'a> {
  pub cookies: &'a str,
}

pub async fn get_tasks(args: TasksArgs<'_>) -> Result<(), GrokError> {
  info!("Building client...");

  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  info!("Configuring client...");

  let builder = client.get(TASKS_URL)
      .header(ACCEPT, "*/*")
      .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT)
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(ORIGIN, "https://grok.com")
      .header(COOKIE, args.cookies.to_string())
      .header(PRAGMA, "no-cache")
      .header(CACHE_CONTROL, "no-cache");

  info!("Sending...");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let status = response.status();
  println!("Status: {}", status);

  for cookie in response.cookies() {
    println!("Cookie: {}={}", cookie.name(), cookie.value());
  }

  for (name, value) in response.headers() {
    println!("Header: {}: {}", name.as_str(), value.to_str().unwrap());
  }

  let body = response.text()
      .await
      .map_err(|err| GrokGenericApiError::WreqError(err))?;

  println!("Body: {}", body);

  Ok(())
}

#[cfg(test)]
mod tests {
  use log::LevelFilter;
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;
  use crate::test_utils::setup_test_logging::setup_test_logging;

  #[tokio::test]
  #[ignore] // manually test
  async fn create() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);

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
