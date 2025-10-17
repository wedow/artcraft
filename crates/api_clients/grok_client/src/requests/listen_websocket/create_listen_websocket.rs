use log::info;
use wreq::Client;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, COOKIE, ORIGIN, PRAGMA, UPGRADE, USER_AGENT};
use wreq::ws::message::Message;
use wreq_util::Emulation;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;

const WEBSOCKET_URL: &str = "wss://grok.com/ws/imagine/listen";

pub struct CreateListenWebsocketArgs<'a> {
  pub cookies: &'a str,
}

pub async fn create_listen_websocket(args: CreateListenWebsocketArgs<'_>) -> Result<(), GrokError> {
  println!("Building client...");
  info!("Building client...");

  let client = Client::builder()
      .emulation(Emulation::Firefox139)
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Configuring client...");
  info!("Configuring client...");

  let builder = client.get(WEBSOCKET_URL)
      .header(ACCEPT, "*/*")
      .header(USER_AGENT, "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header("Sec-WebSocket-Version", "13")
      .header(ORIGIN, "https://grok.com")
      .header("Sec-WebSocket-Extensions", "permessage-deflate")
      // Sec-WebSocket-Key: BhBXbFSG6/1xcZVq4ySxcg==
      .header("Sec-GPC", "1")
      .header(CONNECTION, "keep-alive, Upgrade")
      .header(COOKIE, args.cookies.to_string())
      .header("Sec-Fetch-Dest", "empty")
      .header("Sec-Fetch-Mode", "websocket")
      .header("Sec-Fetch-Site", "same-origin")
      .header(PRAGMA, "no-cache")
      .header(CACHE_CONTROL, "no-cache")
      //.header(UPGRADE, "websocket")
      //.map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Sending...");
  info!("Sending...");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let status = response.status();

  for (k, v) in response.headers().iter() {
    println!("Header: {}: {:?}", k, v);
  }

  println!("Upgrading...");
  info!("Upgrading...");

  let upgraded = response
      .upgrade()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  println!("Status: {}", status);

  println!("Into websocket...");
  info!("Into websocket...");

  let mut websocket = upgraded.into_websocket()
      .await
      .map_err(|err| GrokGenericApiError::WreqError(err))?;

  let message = r#"
    {"type":"conversation.item.create","timestamp":1760675883072,"item":{"type":"message","content":[{"requestId":"3cedf20e-f51c-db5d-a124-bcec05feedf1","text":"A pirannah","type":"input_text","properties":{"section_count":0,"is_kids_mode":false,"enable_nsfw":true,"skip_upsampler":false,"is_initial":false}}]}}
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


  Ok(())
}

#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use super::*;

  #[tokio::test]
  #[ignore] // manually test
  async fn create() -> AnyhowResult<()> {
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

    assert_eq!(1, 2);

    Ok(())
  }
}
