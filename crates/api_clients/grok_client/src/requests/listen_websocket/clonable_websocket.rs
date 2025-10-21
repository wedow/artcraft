use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use futures::stream::FusedStream;
use futures::{Stream, TryStreamExt};
use log::warn;
use serde::Serialize;
use std::sync::{Arc, RwLock};
use wreq::ws::message::Message;
use wreq::ws::WebSocket;

#[derive(Clone)]
pub struct ClonableWebsocket {
  pub(crate) websocket: Arc<RwLock<WebSocket>>,
}

impl ClonableWebsocket {
  pub fn new(websocket: WebSocket) -> Self {
    Self {
      websocket: Arc::new(RwLock::new(websocket)),
    }
  }

  pub async fn send(&self, message: String) -> Result<(), GrokError> {
    match self.websocket.write() {
      Err(err) => Err(GrokClientError::WebsocketLockError.into()),
      Ok(mut websocket) => {
        let message = Message::text(message);
        websocket.send(message)
            .await
            .map_err(|err| {
              GrokClientError::WreqClientError(err)
            })?;
        Ok(())
      },
    }
  }

  pub async fn send_serializable<T: Serialize>(&self, message: T) -> Result<(), GrokError> {
    let message_json = serde_json::to_string(&message)
        .map_err(|err| {
          warn!("Failed to serialize prompt websocket message: {}", err);
          GrokClientError::WebsocketRequestSerializationError(err)
        })?;
    self.send(message_json).await
  }

  pub async fn is_terminated(&self) -> Result<bool, GrokClientError> {
    match self.websocket.read() {
      Err(_) => Err(GrokClientError::WebsocketLockError.into()),
      Ok(websocket) => Ok(websocket.is_terminated()),
    }
  }

  pub async fn try_next(&self) -> Result<Option<Message>, GrokClientError> {
    match self.websocket.write() {
      Err(_) => Err(GrokClientError::WebsocketLockError),
      Ok(mut websocket) => websocket
          .try_next()
          .await
          .map_err(|err| GrokClientError::WebsocketReadError(err)),
    }
  }

  pub fn size_hint(&self) -> Result<(usize, Option<usize>), GrokClientError> {
    match self.websocket.read() {
      Err(_) => Err(GrokClientError::WebsocketLockError),
      Ok(websocket) => Ok(websocket.size_hint())
    }
  }
}
