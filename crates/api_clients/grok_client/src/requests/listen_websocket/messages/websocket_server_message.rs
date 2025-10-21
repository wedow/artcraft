use serde::Deserialize;

#[derive(Deserialize, Clone)]
#[serde(tag = "type")]
pub enum WebsocketServerMessage {
  /// Json with root `type = "image"`
  #[serde(rename = "image")]
  PromptImageData {
  },

  /// Json with root `type = "json"`
  #[serde(rename = "json")]
  JsonData {
  },

  /// Captures any other JSON messages.
  #[serde(untagged)]
  Unknown(serde_json::Value),
}


#[cfg(test)]
mod tests {
  use crate::requests::listen_websocket::messages::websocket_server_message::WebsocketServerMessage;

  #[test]
  fn test_image_complete() -> anyhow::Result<()> {
    let path = "/Users/bt/dev/storyteller/storyteller-rust/crates/api_clients/grok_client/test_data/websocket_messages/create_image_complete_response.json";
    let data = std::fs::read_to_string(path)?;
    let message: WebsocketServerMessage = serde_json::from_str(&data)?;

    Ok(())
  }

  #[test]
  fn test_image_status_complete() -> anyhow::Result<()> {
    let path = "/Users/bt/dev/storyteller/storyteller-rust/crates/api_clients/grok_client/test_data/websocket_messages/create_image_complete_status_notification.json";
    let data = std::fs::read_to_string(path)?;
    let message: WebsocketServerMessage = serde_json::from_str(&data)?;

    Ok(())
  }

  #[test]
  fn test_in_progress() -> anyhow::Result<()> {
    let path = "/Users/bt/dev/storyteller/storyteller-rust/crates/api_clients/grok_client/test_data/websocket_messages/create_image_in_progress_response.json";
    let data = std::fs::read_to_string(path)?;
    let message: WebsocketServerMessage = serde_json::from_str(&data)?;

    Ok(())
  }

  #[test]
  fn test_empty() -> anyhow::Result<()> {
    let path = "/Users/bt/dev/storyteller/storyteller-rust/crates/api_clients/grok_client/test_data/websocket_messages/empty.json";
    let data = std::fs::read_to_string(path)?;
    let message: WebsocketServerMessage = serde_json::from_str(&data)?;

    Ok(())
  }

  #[test]
  fn test_other_type() -> anyhow::Result<()> {
    let path = "/Users/bt/dev/storyteller/storyteller-rust/crates/api_clients/grok_client/test_data/websocket_messages/other_type.json";
    let data = std::fs::read_to_string(path)?;
    let message: WebsocketServerMessage = serde_json::from_str(&data)?;

    Ok(())
  }
}
