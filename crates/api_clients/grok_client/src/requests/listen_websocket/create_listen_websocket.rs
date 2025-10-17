use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use log::info;
use std::ops::Deref;
use std::sync::Arc;
use std::time::Duration;
use tokio::io::AsyncReadExt;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, COOKIE, ORIGIN, PRAGMA, UPGRADE, USER_AGENT};
use wreq::http1::Http1OptionsBuilder;
use wreq::ws::message::Message;
use wreq::Client;
use wreq_util::Emulation;

const WEBSOCKET_URL: &str = "wss://grok.com/ws/imagine/listen";

pub struct CreateListenWebsocketArgs<'a> {
  pub cookies: &'a str,
}

pub async fn create_listen_websocket(args: CreateListenWebsocketArgs<'_>) -> Result<(), GrokError> {
  println!("Building client...");
  info!("Building client...");


  let client = Client::builder()
      .emulation(Emulation::Chrome140)
      .cert_verification(false) // TODO: REMOVE THIS.
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10))
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let cookies = args.cookies.to_string();
  println!("Cookies: {}", cookies);

  println!("Configuring client...");
  info!("Configuring client...");

  let builder = client.websocket(WEBSOCKET_URL)
      .header("Upgrade", "websocket")
      .header("Origin", "https://grok.com")
      .header("Cache-Control", "no-cache")
      .header("Accept-Language", "en-US,en;q=0.9")
      .header("Pragma", "no-cache")
      .header("Cookie", cookies)
      .header("Sec-WebSocket-Key", "BhBXbFSG6/1xcZVq4ySxcg==") // TODO
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")
      .header("Sec-WebSocket-Version", "13")
      .header("Sec-WebSocket-Extensions", "permessage-deflate; client_max_window_bits")
      //.header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0")
      //.force_http2()
      //.header("Accept", "*/*")
      //.header("Accept-Encoding", "gzip, deflate, br, zstd")
      //.header("Sec-WebSocket-Extensions", "permessage-deflate")
      //.header("Sec-GPC", "1")
      //.header("Connection", "keep-alive, Upgrade")
      //.header("Sec-Fetch-Dest", "empty")
      //.header("Sec-Fetch-Mode", "websocket")
      //.header("Sec-Fetch-Site", "same-origin")
      //.read_buffer_size(1024 * 1024)
      //.write_buffer_size(1024 * 1024)
      ;

  println!("Sending...");
  info!("Sending...");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Response version: {:?}", response.version());

  let status = response.status();
  println!("Status: {}", status);


  println!("Into websocket...");
  info!("Into websocket...");

  // ApiGeneric(WreqError(wreq::Error { kind: Upgrade, source: "unexpected status code: 403 Forbidden" }))
  let mut websocket = response.into_websocket()
      .await
      .map_err(|err| GrokGenericApiError::WreqError(err))?;

  if let Some(protocol) = websocket.protocol() {
    println!("WebSocket subprotocol: {:?}", protocol);
  }

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

