use chrono::Utc;
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize)]
pub struct WebsocketClientMessage {
  /// Type of message
  /// eg. "conversation.item.create"
  pub r#type: String,

  /// Unix timestamp
  pub timestamp: u64,

  pub item: ClientMessageItem,
}

#[derive(Serialize)]
pub struct ClientMessageItem {
  /// Type of item
  /// eg. "message"
  pub r#type: String,

  pub content: Vec<ClientMessageItemContent>,
}

#[derive(Serialize)]
pub struct ClientMessageItemContent {
  /// UUID
  #[serde(rename="requestId")]
  pub request_id: String,

  /// Type of item content
  /// eg. "input_text"
  pub r#type: String,

  /// The prompt for the request
  pub text: String,

  pub properties: ClientMessageItemContentProperties,
}

#[derive(Serialize)]
pub struct ClientMessageItemContentProperties {
  pub section_count: usize,
  pub is_kids_mode: bool,
  pub enable_nsfw: bool,
  pub skip_upsampler: bool,
  pub is_initial: bool,
  pub aspect_ratio: ClientMessageAspectRatio,
}

#[derive(Serialize, Clone, Copy)]
pub enum ClientMessageAspectRatio {
  #[serde(rename = "2:3")]
  TallTwoByThree,

  #[serde(rename = "3:2")]
  WideThreeByTwo,

  #[serde(rename = "1:1")]
  Square,
}

impl WebsocketClientMessage {
  /// Create a new image prompt websocket client message
  pub fn new_image_prompt(prompt: &str, aspect_ratio: ClientMessageAspectRatio) -> Self {
    /*
    {
      "type":"conversation.item.create",
      "timestamp":1764222761003,
      "item": {
        "type":"message",
        "content": [
          {
            "requestId":"efdde1fc-2427-4f49-bd90-3e54df0e6294",
            "text":"fighter jet in the taco bell drive thru",
            "type":"input_text",
            "properties": {
              "section_count":0,
              "is_kids_mode":false,
              "enable_nsfw":true,
              "skip_upsampler":false,
              "is_initial":false,
              "aspect_ratio":"2:3"
            }
          }
        ]
      }
    }

    "2:3"
    "3:2"
    "1:1"

    {"type":"conversation.item.create","timestamp":1764223129572,"item":{"type":"message","content":[{"requestId":"3825ffdd-0613-48ba-9a50-fb75bbfbdba0","text":"tank at mcdonalds","type":"input_text","properties":{"section_count":0,"is_kids_mode":false,"enable_nsfw":true,"skip_upsampler":false,"is_initial":false,"aspect_ratio":"1:1"}}]}}
    {"type":"conversation.item.create","timestamp":1764223055299,"item":{"type":"message","content":[{"requestId":"86361ecf-bdcf-4159-bfcb-f1097dc7499d","text":"an attack helicopter at Burger King","type":"input_scroll","properties":{"section_count":0,"is_kids_mode":false,"enable_nsfw":true,"skip_upsampler":false,"is_initial":false,"aspect_ratio":"3:2"}}]}}
     */
    Self {
      r#type: "conversation.item.create".to_string(),
      timestamp: Utc::now().timestamp_millis() as u64,
      item: ClientMessageItem {
        r#type: "message".to_string(),
        content: vec![
          ClientMessageItemContent {
            request_id: Uuid::new_v4().to_string(),
            r#type: "input_text".to_string(),
            text: prompt.to_string(),
            properties: ClientMessageItemContentProperties {
              section_count: 0,
              is_kids_mode: false,
              enable_nsfw: true,
              skip_upsampler: false,
              is_initial: false,
              aspect_ratio,
            },
          }
        ],
      },
    }
  }
}
