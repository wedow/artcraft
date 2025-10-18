use crate::client::browser_user_agents::FIREFOX_139_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use std::ops::Deref;
use std::time::Duration;
use tokio::io::AsyncReadExt;
use wreq::header::USER_AGENT;
use wreq::Client;
use wreq_util::Emulation;

const WEBSOCKET_URL: &str = "wss://grok.com/ws/imagine/listen";

pub async fn create_listen_websocket_new() -> Result<(), GrokError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox139)
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10))
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  //.http1_only() // NB: Not needed - websockets are sent over HTTP/1.1 without this configuration
  //.cookie_store(true)

  let cookies = "_ga=GA1.1.1232202746.1760710013; i18nextLng=en; sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiOGU3MDFiNzctOTdkNC00ZjM0LWExOTctOWFmMDU1MzY3NDAwIn0.-a6x0InxbGzfTVfUlrdzxskxCnvMDI8lC90z4wHeGIk; sso-rw=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiOGU3MDFiNzctOTdkNC00ZjM0LWExOTctOWFmMDU1MzY3NDAwIn0.-a6x0InxbGzfTVfUlrdzxskxCnvMDI8lC90z4wHeGIk; stblid=b3331fc1-45d7-466b-83df-67427c0b2367; mp_ea93da913ddb66b6372b89d97b1029ac_mixpanel=%7B%22distinct_id%22%3A%2285980643-ffab-4984-a3de-59a608c47d7f%22%2C%22%24device_id%22%3A%2279ce237a-a0f3-4913-bf4b-519ac8a98263%22%2C%22%24initial_referrer%22%3A%22%24direct%22%2C%22%24initial_referring_domain%22%3A%22%24direct%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%2C%22%24user_id%22%3A%2285980643-ffab-4984-a3de-59a608c47d7f%22%7D; cf_clearance=e7.LXFbmc.U81rZIqxuBfBe88yuBZMXEP.zwxNkbOxw-1760724394-1.2.1.1-JMHrapBGxcZriUw852.NCqwFRpZJFvoYxq.mV0jDpKCkiHBZwpdv09XJi6eFLJUYJJ6UDZ3c1eAsucVYLdWN.SvA9M6qzujj8nY4ym03PxQlMEd2OmXJogtDDJbPhA5AZEGxA39_6QQlvaBIUBnYPALYrTl9XJN_V4q3n4BXtpoBzrIJURMIn0mW3esUCGv0NukuVQrkrNtMgqT5SUmTGi0idaBYoR_2_wv4P09lsug; _ga_8FEWB057YH=GS2.1.s1760724394$o3$g1$t1760724401$j53$l0$h0";
  //let user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

  let builder = client.websocket(WEBSOCKET_URL)
      .header("Accept", "*/*")
      .header("Cookie", cookies)
      .header("Host", "grok.com")
      .header(USER_AGENT, FIREFOX_139_MAC_USER_AGENT);

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Response version: {:?}", response.version());

  let status = response.status();
  println!("Status: {}", status);
  
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

