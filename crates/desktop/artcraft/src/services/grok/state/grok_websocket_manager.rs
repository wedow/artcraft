use grok_client::requests::image_websocket::grok_websocket::GrokWebsocket;
use std::sync::{Arc, RwLock};

#[derive(Clone)]
pub struct GrokWebsocketHolder {
  websocket: Arc<RwLock<GrokWebsocket>>,
}