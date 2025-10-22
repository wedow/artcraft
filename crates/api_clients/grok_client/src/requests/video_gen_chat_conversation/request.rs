use serde::Serialize;

#[derive(Serialize)]
pub (super) struct CreateChatConversationWireRequest {
  #[serde(rename = "temporary")]
  pub (super) temporary: bool,

  #[serde(rename = "modelName")]
  pub (super) model_name: String,

  /// The prompt
  #[serde(rename = "message")]
  pub (super) message: String,

  #[serde(rename = "fileAttachments")]
  pub (super) file_attachments: Vec<String>,


  #[serde(rename = "toolOverrides")]
  pub (super) tool_overrides: ToolOverrides,
}

#[derive(Serialize)]
pub (super) struct ToolOverrides {
  #[serde(rename = "toolOverrides")]
  pub (super) video_gen: bool,
}

/*
--data-raw 
  {
    "temporary":true,
    "modelName":"grok-3",
    "message":"https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/21a79085-e206-4b0b-88ac-5f2b7a453e45/content  --mode=normal",
    "fileAttachments": [
      "21a79085-e206-4b0b-88ac-5f2b7a453e45"
    ],
    "toolOverrides": {
      "videoGen":true
    }
  }
 */
