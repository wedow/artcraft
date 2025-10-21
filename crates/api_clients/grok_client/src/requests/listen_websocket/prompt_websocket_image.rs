use log::warn;
use wreq::ws::WebSocket;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::requests::listen_websocket::clonable_websocket::ClonableWebsocket;
use crate::requests::listen_websocket::messages::websocket_request::{WebsocketRequest, WebsocketRequestItem};

pub struct PromptWebsocketImageArgs<'a> {
  pub websocket_wrapped: ClonableWebsocket,
  pub prompt: &'a str,
}


pub async fn prompt_websocket_image(args: PromptWebsocketImageArgs<'_>) -> Result<(), GrokError> {
  let message = WebsocketRequest::new_image_prompt(args.prompt);

  args.websocket_wrapped.send_serializable(&message).await?;

  Ok(())
}

#[cfg(test)]
mod tests {
  use std::io::Write;
  use std::time::Duration;
  use anyhow::anyhow;
  use futures::TryStreamExt;
  use log::{warn, LevelFilter};
  use errors::AnyhowResult;
  use crate::requests::listen_websocket::clonable_websocket::ClonableWebsocket;
  use crate::requests::listen_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
  use crate::requests::listen_websocket::prompt_websocket_image::{prompt_websocket_image, PromptWebsocketImageArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;

  #[tokio::test]
  #[ignore] // manually test
  async fn prompt() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    //let cookies = SESSION_COOKIES_WITHOUT_CF_CLEARANCE;

    let cookies = get_test_cookies()?;

    let mut websocket = create_listen_websocket(CreateListenWebsocketArgs {
      cookies: &cookies,
    }).await?;

    let websocket = ClonableWebsocket::new(websocket);

    println!("Sending...");
    std::io::stdout().flush()?;


    let result = prompt_websocket_image(PromptWebsocketImageArgs {
      websocket_wrapped: websocket.clone(),
      prompt: "a dog riding a skateboard",
    }).await?;

    println!("Reading...");
    std::io::stdout().flush()?;

    let mut count = 0;
    while let Some(message) = websocket.try_next().await? {
      println!("[{count}] Received websocket message: {:?}", message);

      count = count + 1;

      tokio::time::sleep(Duration::from_millis(1000)).await;

      if count > 10 {
        break;
      }
    }

    log::logger().flush();

    assert_eq!(1,2);

    Ok(())
  }
}