use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::datatypes::api::baggage::Baggage;
use crate::datatypes::api::file_id::FileId;
use crate::datatypes::api::sentry_trace::SentryTrace;
use crate::datatypes::api::svg_path_data::SvgPathData;
use crate::datatypes::api::user_id::UserId;
use crate::datatypes::api::verification_token::VerificationToken;
use crate::datatypes::api::xsid_numbers::XsidNumbers;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::index_page::signature::generate_xsid::{generate_xsid, GenerateXsidArgs};
use crate::requests::upload_file::grok_upload_file::{GrokUploadFile, GrokUploadFileResponse};
use crate::requests::video_chat::parse_video_id::parse_video_id;
use crate::requests::video_chat::request::{CreateChatConversationWireRequest, ModelConfigOverride, ModelMap, ResponseMetadata, ToolOverrides, VideoGenModelConfig};
use crate::utils::user_and_file_id_to_image_url::user_and_file_id_to_image_url;
use log::{debug, error, info, warn};
use std::time::Duration;
use uuid::Uuid;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, COOKIE, ORIGIN, PRAGMA, REFERER, TE, USER_AGENT};
use wreq::Client;
use wreq_util::Emulation;

const CHAT_CONVERSATION_URL: &str = "https://grok.com/rest/app-chat/conversations/new";

/// Request builder
pub struct GrokVideoGenChatConversationBuilder<'a> {
  pub file_id: &'a FileId,
  pub media_type: VideoMediaPostType,
  pub prompt: Option<&'a str>,

  pub cookie: &'a str,
  pub user_id: &'a UserId,

  pub baggage: &'a Baggage,
  pub sentry_trace: &'a SentryTrace,
  pub verification_token: &'a VerificationToken,
  pub svg_data: &'a SvgPathData,
  pub numbers: &'a XsidNumbers,

  pub request_timeout: Option<Duration>,
}

#[derive(Debug, Copy, Clone)]
pub enum VideoMediaPostType {
  UserUploadedImage,
  GrokGeneratedImage,
  Video,
}

/// Response type
#[derive(Debug)]
pub struct GrokVideoGenChatConversationResponse {
  pub video_file_id: Option<FileId>,
}

impl <'a> GrokVideoGenChatConversationBuilder<'a> {
  pub async fn send(&self) -> Result<GrokVideoGenChatConversationResponse, GrokError> {
    info!("Configuring client...");

    let client = Client::builder()
        .emulation(Emulation::Firefox143)
        .build()
        .map_err(|err| GrokClientError::WreqClientError(err))?;

    let xai_request_id = Uuid::new_v4().to_string();
    let sentry_trace_header = self.sentry_trace.to_http_request_header();

    debug!("xai_request_id (uuid) = {}", xai_request_id);
    debug!("sentry_trace = {}", sentry_trace_header);

    let x_statsig_id = generate_xsid(GenerateXsidArgs {
      path: "/rest/app-chat/conversations/new",
      method: "POST",
      verification_token: &self.verification_token,
      svg_data: &self.svg_data,
      numbers: &self.numbers,
    })?;

    debug!("x_statsig_id = {}", x_statsig_id);

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
        .header("x-statsig-id", x_statsig_id)
        .header("sentry-trace", sentry_trace_header)
        .header("baggage", &self.baggage.0)
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
      VideoMediaPostType::UserUploadedImage => user_and_file_id_to_image_url(self.user_id, self.file_id),
      VideoMediaPostType::GrokGeneratedImage => unimplemented!("implement for generated images"),
      VideoMediaPostType::Video => unimplemented!("implement for videos"),
    };

    let mut prompt = format!("{media_url}  --mode=normal");

    if let Some(user_prompt) = self.prompt {
      prompt = format!("{media_url}  {user_prompt} --mode=custom");
    }

    let request_body = CreateChatConversationWireRequest {
      temporary: true,
      model_name: "grok-3".to_string(),
      message: prompt,
      file_attachments: vec![
        self.file_id.0.to_string(),
      ],
      tool_overrides: ToolOverrides {
        video_gen: true,
      },
      response_metadata: ResponseMetadata {
        model_config_override: ModelConfigOverride {
          model_map: ModelMap {
            video_gen_model_config: VideoGenModelConfig {
              parent_post_id: self.file_id.0.to_string(),
            },
          },
        },
      },
    };

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

    info!("Video Generation Enqueue Status: {:?}", status);

    /// Body: {"error":{"code":7,"message":"Request rejected by anti-bot rules.","details":[]}}
    let response_body = &response.text()
        .await
        .map_err(|err| {
          error!("Error reading Grok create media response body: {:?}", err);
          GrokGenericApiError::WreqError(err)
        })?;

    // TODO: Handle unsuccessful request
    if !status.is_success() {
      warn!("Not successful enqueuing video gen (code: {}) : {:?}", status.as_u16(), response_body);
      //  error!("Upload file request returned an error (code {}) : {:?}", status.as_u16(), response_body);
      //  return Err(classify_general_http_status_code_and_body(status, response_body));
    }

    // TODO: Just for now...
    info!("Video Body: {:?}", response_body);

    let file_id = parse_video_id(&response_body);

    Ok(GrokVideoGenChatConversationResponse {
      video_file_id: file_id,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::datatypes::file_upload_spec::FileUploadSpec;
  use crate::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
  use crate::test_utils::get_test_cookies::get_typed_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore]
  async fn create_video() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);

    let cookies = get_typed_test_cookies()?;

    let secrets = request_client_secrets(RequestClientSecretsArgs {
      cookies: &cookies,
    }).await?;

    //let file_id = FileId("990ddf90-8f34-42b1-81a5-39c509d62ff7".to_string()); // Mochi

    let upload_request = GrokUploadFile {
      file: FileUploadSpec::Path("/Users/bt/dev/storyteller/storyteller-rust/test_data/image/mochi.jpg"),
      cookie: cookies.to_string(),
      request_timeout: None,
    };

    let upload_result = upload_request.upload().await?;

    let file_id = upload_result.file_id.expect("upload should have file_id");

    println!("Verification Token: {:?}", secrets.verification_token);
    println!("Sentry Trace: {:?}", secrets.sentry_trace);
    println!("Numbers: {:?}", secrets.numbers);
    println!("Svg Path: {:?}", secrets.svg_path_data);
    println!("Baggage: {:?}", secrets.baggage);

    let request = GrokVideoGenChatConversationBuilder {
      file_id: &file_id,
      media_type: VideoMediaPostType::UserUploadedImage,
      prompt: Some("dog shakes the glasses off"),

      cookie: cookies.as_str(),
      user_id: &secrets.user_id,
      baggage: &secrets.baggage,
      sentry_trace: &secrets.sentry_trace,
      verification_token: &secrets.verification_token,
      svg_data: &secrets.svg_path_data,
      numbers: &secrets.numbers,

      request_timeout: None,
    };

    let result = request.send().await?;

    println!("Result: {:?}", result);
    assert_eq!(1, 2);
    Ok(())
  }
}
