use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::upload_file::grok_upload_file::{FileSpec, GrokUploadFile, GrokUploadFileResponse};
use crate::requests::video_gen_chat_conversation::request::{CreateChatConversationWireRequest, ToolOverrides};
use crate::types::file_id::FileId;
use crate::types::user_id::UserId;
use crate::utils::user_and_file_id_to_image_url::user_and_file_id_to_image_url;
use log::{error, info};
use std::time::Duration;
use uuid::Uuid;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, COOKIE, ORIGIN, PRAGMA, REFERER, TE, USER_AGENT};
use wreq::Client;
use wreq_util::Emulation;

const CHAT_CONVERSATION_URL: &str = "https://grok.com/rest/app-chat/conversations/new";

/// Request builder
pub struct GrokVideoGenChatConversationBuilder<'a> {
  pub user_id: &'a UserId,
  pub file_id: &'a FileId,
  pub media_type: MediaPostType,
  pub cookie: &'a str,
  // TODO: Optional prompt
  pub prompt: &'a str,
  pub request_timeout: Option<Duration>,

  pub baggage: &'a str,
  pub sentry_trace: &'a str,
  pub x_statsig: &'a str,
}

#[derive(Debug, Copy, Clone)]
pub enum MediaPostType {
  UserUploadedImage,
  GrokGeneratedImage,
  Video,
}

/// Response type
#[derive(Debug)]
pub struct GrokVideoGenChatConversationResponse {
}

impl <'a> GrokVideoGenChatConversationBuilder<'a> {
  pub async fn send(&self) -> Result<GrokVideoGenChatConversationResponse, GrokError> {
    info!("Configuring client...");

    let client = Client::builder()
        .emulation(Emulation::Firefox143)
        .build()
        .map_err(|err| GrokClientError::WreqClientError(err))?;

    let xai_request_id = Uuid::new_v4().to_string();
    println!("{}", xai_request_id);

    // f'{self.sentry_trace}-{str(uuid4()).replace("-", "")[:16]}-0',
    //   inner bit = str(uuid4()).replace("-", "")[:16]
    let sentry_start = self.sentry_trace;
    let sentry_uuid = Uuid::new_v4().to_string();
    let sentry_inner = sentry_uuid.replace("-", "")[..16].to_string();
    let sentry_trace = format!("{sentry_start}-{sentry_inner}-0");

    println!("{}", sentry_trace);

    // TODO: Headers were from Chromium, not Firefox. Partial implementation.
    let mut request_builder = client.post(CHAT_CONVERSATION_URL)
        //.header(PRAGMA, "no-cache") // Not on firefox
        //.header(CACHE_CONTROL, "no-cache") // Not on firefox
        .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT)
        .header(ACCEPT, "*/*")
        .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
        .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
        .header(REFERER, "https://grok.com/imagine/favorites")
        //.header("traceparent", "") // TODO ??
        .header(CONTENT_TYPE, "application/json")
        .header("x-xai-request-id", xai_request_id)
        .header("x-statsig-id", self.x_statsig)
        .header("sentry-trace", sentry_trace)
        .header("baggage", self.baggage)
        // TODO: Missing header "traceparent" ****
        .header(ORIGIN, "https://grok.com")
        //.header("priority", "u=1, i") // Different on firefox
        .header("priority", "u=4")
        //.header("sec-ch-ua", "") // TODO / NB: NOT IN FIREFOX
        //.header("sec-ch-ua-mobile", "") // TODO / NB: NOT IN FIREFOX
        //.header("sec-ch-ua-platform", "") // TODO / NB: NOT IN FIREFOX
        .header("sec-fetch-dest", "empty")
        .header("sec-fetch-mode", "cors")
        .header("sec-fetch-site", "same-origin")
        .header("Sec-GPC", "1")
        .header(CONNECTION, "keep-alive")
        .header(COOKIE, self.cookie.to_string())
        .header(TE, "trailers");

    if let Some(timeout) = self.request_timeout {
      request_builder = request_builder.timeout(timeout);
    }

    let media_url = match self.media_type {
      MediaPostType::UserUploadedImage => user_and_file_id_to_image_url(self.user_id, self.file_id),
      MediaPostType::GrokGeneratedImage => unimplemented!("implement for generated images"),
      MediaPostType::Video => unimplemented!("implement for videos"),
    };

    let prompt = format!("{media_url}  --mode=normal");

    let request_body = CreateChatConversationWireRequest {
      temporary: true,
      model_name: "grok-3".to_string(),
      message: prompt,
      file_attachments: vec![
        self.file_id.0.to_string(),
      ],
      tool_overrides: ToolOverrides {
        video_gen: true,
      }
    };

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

    let http_request = request_builder.json(&request_body)
        .build()
        .map_err(|err| {
          error!("Error building create media request: {:?}", err);
          GrokClientError::WreqClientError(err)
        })?;

    let response = client.execute(http_request)
        .await
        .map_err(|err| {
          error!("Error during create media: {:?}", err);
          GrokGenericApiError::WreqError(err)
        })?;

    let status = response.status();

    /// Body: {"error":{"code":7,"message":"Request rejected by anti-bot rules.","details":[]}}
    let response_body = &response.text()
        .await
        .map_err(|err| {
          error!("Error reading Grok create media response body: {:?}", err);
          GrokGenericApiError::WreqError(err)
        })?;

    println!("Body: {}", response_body);

    // TODO:
    //if !status.is_success() {
    //  error!("Upload file request returned an error (code {}) : {:?}", status.as_u16(), response_body);
    //  return Err(classify_general_http_status_code_and_body(status, response_body));
    //}

    //let response : GrokApiUploadFileResponse = serde_json::from_str(response_body)
    //    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

    Ok(GrokVideoGenChatConversationResponse {
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore]
  async fn create_video() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);
    let cookies = get_test_cookies()?;

    let user_id = UserId("85980643-ffab-4984-a3de-59a608c47d7f".to_string()); // User
    let file_id = FileId("990ddf90-8f34-42b1-81a5-39c509d62ff7".to_string()); // Mochi

    let request = GrokVideoGenChatConversationBuilder {
      user_id: &user_id,
      file_id: &file_id,
      media_type: MediaPostType::UserUploadedImage,
      cookie: &cookies,
      prompt: "dog shakes the glasses off",
      request_timeout: None,
      
      baggage: "", // TODO
      sentry_trace: "", // TODO
      x_statsig: "", // TODO
    };

    let result = request.send().await?;

    println!("Result: {:?}", result);
    assert_eq!(1, 2);
    Ok(())
  }

}
