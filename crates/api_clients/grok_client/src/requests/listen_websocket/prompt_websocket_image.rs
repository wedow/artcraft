use crate::error::grok_error::GrokError;
use crate::requests::listen_websocket::clonable_websocket::ClonableWebsocket;
use crate::requests::listen_websocket::messages::websocket_request::WebsocketRequest;

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
  use crate::requests::listen_websocket::clonable_websocket::ClonableWebsocket;
  use crate::requests::listen_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
  use crate::requests::listen_websocket::prompt_websocket_image::{prompt_websocket_image, PromptWebsocketImageArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use futures::TryStreamExt;
  use log::LevelFilter;
  use std::io::Write;
  use std::time::Duration;

  #[tokio::test]
  #[ignore] // manually test
  async fn prompt() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);
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
      prompt: "a dog riding a bike in space",
    }).await?;

    println!("Reading...");
    std::io::stdout().flush()?;

    let mut count = 0;

    println!("Polling.");

    //while let Some(message) = websocket.try_next().await? {
    //  println!("[{count}] Received websocket message: {:?}", message);
    //  count = count + 1;
    //  tokio::time::sleep(Duration::from_millis(1000)).await;
    //  if count > 1000 {
    //    break;
    //  }
    //}

    //loop {
    //  count = count + 1;
    //  let bounds = websocket.size_hint()?;
    //  println!("Websocket size hint: {:?}", bounds);
    //  tokio::time::sleep(Duration::from_millis(1000)).await;
    //  if count > 30 {
    //    break;
    //  }
    //}

    loop {
      let maybe_message =
          websocket.try_next_timeout(Duration::from_millis(1000)).await?;

      match maybe_message {
        None => {
          println!("No message received within timeout.");
          count = count + 1;
        }
        Some(message) => {
          println!("[{count}] Received websocket message!");//: {:?}", message);
          count = 0;
        }
      }

      if count > 5 {
        println!("No messages after 5 seconds");
        break;
      }
    }

    println!("Done polling.");

    log::logger().flush();

    assert_eq!(1,2);

    Ok(())
  }
}