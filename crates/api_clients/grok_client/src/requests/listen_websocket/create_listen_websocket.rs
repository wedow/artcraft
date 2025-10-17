use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use log::{debug, error, info, trace, warn};
use std::ops::Deref;
use std::sync::Arc;
use std::time::Duration;
use tokio::io::AsyncReadExt;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, COOKIE, ORIGIN, PRAGMA, UPGRADE, USER_AGENT};
use wreq::http1::{Http1Options, Http1OptionsBuilder};
use wreq::ws::message::Message;
use wreq::Client;
use wreq_util::Emulation;

const WEBSOCKET_URL: &str = "wss://grok.com/ws/imagine/listen";
//const WEBSOCKET_URL: &str = "https://grok.com/ws/imagine/listen";

pub struct CreateListenWebsocketArgs<'a> {
  pub cookies: &'a str,
}

pub async fn create_listen_websocket(args: CreateListenWebsocketArgs<'_>) -> Result<(), GrokError> {
  println!("Building client...");
  info!("Building client...");


  let client = Client::builder()
      .emulation(Emulation::Chrome140)
      //.http1_only() // NB: Not needed - websockets are sent over HTTP/1.1 without this configuration
      .cert_verification(false) // TODO: REMOVE THIS.
      .connection_verbose(true)
      .cookie_store(true)
      .connect_timeout(Duration::from_secs(10))
      //.keylog()
      //.http1_options(Http1Options::builder().build())
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let cookies = args.cookies.to_string();

  let cookies = "_ga=GA1.1.1232202746.1760710013; i18nextLng=en; x-anonuserid=621371fd-a877-4245-900c-1aa8db6039f2; x-challenge=2CHUrpA5J8%2FW2%2F1H8glEE3WKIXTKrbU7mMARWLT5DHzp5MS6nUk1aTHt7gqzv1vCxfnIdHTdeq4ZLYwcBj1DL%2FBptSSVT9OKi9DQDsN%2BKk0Ur3jg1uS%2BuPtwYSNZ%2B6CtuLCrDZqlDh%2FfFTzYr2sQ9nT3R72HfOyS%2FFXw0qvCgoROCtZCiGY%3D; x-signature=qPh93ojC8uCXOUvq7t0SzcwsyXKOE%2BRXH6dH26oL8lxwRIabYha6eniSt329QvpjBEeUqlekeStaek44mDpEYg%3D%3D; sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiOGU3MDFiNzctOTdkNC00ZjM0LWExOTctOWFmMDU1MzY3NDAwIn0.-a6x0InxbGzfTVfUlrdzxskxCnvMDI8lC90z4wHeGIk; sso-rw=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiOGU3MDFiNzctOTdkNC00ZjM0LWExOTctOWFmMDU1MzY3NDAwIn0.-a6x0InxbGzfTVfUlrdzxskxCnvMDI8lC90z4wHeGIk; stblid=b3331fc1-45d7-466b-83df-67427c0b2367; mp_ea93da913ddb66b6372b89d97b1029ac_mixpanel=%7B%22distinct_id%22%3A%2285980643-ffab-4984-a3de-59a608c47d7f%22%2C%22%24device_id%22%3A%2279ce237a-a0f3-4913-bf4b-519ac8a98263%22%2C%22%24initial_referrer%22%3A%22%24direct%22%2C%22%24initial_referring_domain%22%3A%22%24direct%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%2C%22%24user_id%22%3A%2285980643-ffab-4984-a3de-59a608c47d7f%22%7D; cf_clearance=HBGeoT0XFc4oFd083362oxL5_2kXlFuxjVdhdqbjmvc-1760719202-1.2.1.1-otB93onljmuJsNnVq00Zliw5S5OFQB4dsZ6Ahx690e_o6vUxj2SgeVtjc4JaiYl5yqY4pi9K9LAMH3xCkIMioqX6QXq3VFm6SAnnz5xiorw4ZAP.ChbkUwop4HQ6pKOKIqq68vvpCibOsgpateGNFqgEmWhpJDT1pKarqAU6OB.w7uj4eNDPVWdRjBaTxAna9ehazWIF77E7K4cbz878nyqDxj_dLcSlHSCsM.Le5a8; _ga_8FEWB057YH=GS2.1.s1760719202$o2$g0$t1760719202$j60$l0$h0".to_string();
  println!("Cookies: {}", cookies);

  get_tasks(&client, &cookies).await?;

  println!("Configuring client for websocket...");
  info!("Configuring client for websocket...");

  let builder = client.websocket(WEBSOCKET_URL)
      .header("Host", "grok.com") // Chrome
      .header("Connection", "Upgrade") // Chrome
      .header("Pragma", "no-cache") // Chrome
      .header("Cache-Control", "no-cache") // Chrome
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36") // Chrome
      .header("Upgrade", "websocket") // Chrome
      .header("Origin", "https://grok.com") // Chrome
      .header("Sec-WebSocket-Version", "13") // Chrome
      .header("Accept-Encoding", "gzip, deflate, br, zstd") // Chrome
      .header("Accept-Language", "en-US,en;q=0.9") // Chrome
      .header("Cookie", cookies)
      .header("Sec-WebSocket-Key", "BhBXbFSG6/1xcZVq4ySxcg==") // TODO
      .header("Sec-WebSocket-Extensions", "permessage-deflate; client_max_window_bits"); // Chrome
      //.header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0")
      //.force_http2()
      //.header("Accept", "*/*")
      //.header("Sec-WebSocket-Extensions", "permessage-deflate")
      //.header("Sec-GPC", "1")
      //.header("Connection", "keep-alive, Upgrade")
      //.header("Sec-Fetch-Dest", "empty")
      //.header("Sec-Fetch-Mode", "websocket")
      //.header("Sec-Fetch-Site", "same-origin")
      //.read_buffer_size(1024 * 1024)
      //.write_buffer_size(1024 * 1024)

  println!("Sending...");
  info!("Sending...");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Response version: {:?}", response.version());

  let status = response.status();
  println!("Status: {}", status);

  Ok(())
}

async fn get_tasks(client: &Client, cookies_header: &str) -> Result<(), GrokError> {
  info!("Getting page...");

  let builder = client.get("https://grok.com/rest/tasks")
      .header(ACCEPT, "*/*")
      .header(USER_AGENT, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(ORIGIN, "https://grok.com")
      .header(COOKIE, cookies_header)
      .header(PRAGMA, "no-cache")
      .header(CACHE_CONTROL, "no-cache");

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
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // manually test
  async fn create() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);

    let cookies = get_test_cookies()?;
    let args = CreateListenWebsocketArgs {
      cookies: &cookies,
    };
    let result = create_listen_websocket(args).await;

    match result {
      Ok(ok) => {
        println!("Okay");
      }
      Err(err) => {
        println!("{:?}", err);
      }
    }

    log::logger().flush();

    assert_eq!(1, 2);

    Ok(())
  }
}





/*
let message = r#"
  {"type":"conversation.item.create","timestamp":1760673207293,"item":{"type":"message","content":[{"requestId":"3cedf20e-f51f-da5d-a124-ccec05faedf1","text":"A pirannah","type":"input_text","properties":{"section_count":0,"is_kids_mode":false,"enable_nsfw":true,"skip_upsampler":false,"is_initial":false}}]}}
"#.trim().to_string();

let wire_message = Message::text(message);

websocket.send(wire_message)
    .await
    .map_err(|err| GrokGenericApiError::WreqError(err))?;

loop {
  let maybe_message = websocket.recv().await;

  if let Some(message) = maybe_message {
    let message = message.map_err(|err| GrokGenericApiError::WreqError(err))?;

    match message {
      Message::Text(text) => {
        println!("Received text message: {}", text);
      }
      Message::Binary(bin) => {
        println!("Received binary message: {:?}", bin);
      }
      Message::Ping(ping) => {
        println!("Received ping: {:?}", ping);
      }
      Message::Pong(pong) => {
        println!("Received pong: {:?}", pong);
      }
      Message::Close(close_frame) => {
        println!("Received close: {:?}", close_frame);
        break;
      }
      _ => {
        println!("Received other message: {:?}", message);
      }
    }

    tokio::time::sleep(std::time::Duration::from_millis(15_000)).await;
  }
}
*/

//for (k, v) in response.headers().iter() {
//  println!("Header: {}: {:?}", k, v);
//}

//println!("Upgrading...");
//info!("Upgrading...");
//let upgraded = response
//    .upgrade()
//    .await
//    .map_err(|err| GrokClientError::WreqClientError(err))?;


// println!("Into websocket...");
// info!("Into websocket...");

// // ApiGeneric(WreqError(wreq::Error { kind: Upgrade, source: "unexpected status code: 403 Forbidden" }))
// let mut websocket = response.into_websocket()
//     .await
//     .map_err(|err| GrokGenericApiError::WreqError(err))?;

// if let Some(protocol) = websocket.protocol() {
//   println!("WebSocket subprotocol: {:?}", protocol);
// }
