use crate::constants::user_agent::USER_AGENT;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::requests::common::task_id::TaskId;
use crate::requests::generate_sora2_video::http_request::{HttpCreateRequest, InpaintItem};
use crate::requests::generate_sora2_video::http_response::HttpCreateResponse;
use crate::requests::image_gen::image_gen_http_request::{RawSoraImageGenRequest, RawSoraResponse};
use log::error;
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_LANGUAGE, AUTHORIZATION, CONTENT_TYPE, COOKIE, ORIGIN, REFERER};
use wreq::Client;

const GENERATE_SORA_2_VIDEO_URL: &str = "https://sora.chatgpt.com/backend/nf/create";

#[derive(Clone)]
pub struct GenerateSora2VideoArgs<'a> {
  pub prompt: &'a str,
  pub credentials: &'a SoraCredentialSet,
  pub request_timeout: Option<Duration>,
  pub orientation: Orientation,
  pub image_reference_media_ids: Option<&'a Vec<String>>,
}

#[derive(Clone, Copy)]
pub enum Orientation {
  Portrait,
  Landscape,
}

#[derive(Debug)]
pub struct GenerateSora2VideoResponse {
  pub task_id: TaskId,
}

pub (crate) async fn generate_sora2_video(
  args: GenerateSora2VideoArgs<'_>,
) -> Result<GenerateSora2VideoResponse, SoraError> {

  let client = Client::new();

  let authorization_header = args.credentials.jwt_bearer_token.as_ref()
      .ok_or(SoraClientError::NoBearerTokenForRequest)?
      .to_authorization_header_value();

  //let sentinel = args.credentials.sora_sentinel.as_ref()
  //    .map(|sentinel| sentinel.get_sentinel().to_string())
  //    .ok_or(SoraClientError::NoSentinelTokenForRequest)?;

  let cookie = args.credentials.cookies.to_string();

  // TODO: Make the sec-* headers match the user agent and platform
  // TODO: No sentinel?
  // TODO: device id
  //-H 'oai-device-id: 7c216860-5b73-4e63-983f-142dbcae1809' \
  let mut http_request = client.post(GENERATE_SORA_2_VIDEO_URL)
      //.header("OpenAI-Sentinel-Token", &sentinel);
      .header(ACCEPT, "*/*")
      .header("priority", "u=1, i")
      .header(REFERER, "https://sora.chatgpt.com/explore")
      .header(ORIGIN, "https://sora.chatgpt.com")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.9")
      .header(wreq::header::USER_AGENT, USER_AGENT)
      .header(COOKIE, &cookie)
      .header(AUTHORIZATION, &authorization_header)
      .header(CONTENT_TYPE, "application/json")
      .header("sec-ch-ua", "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"")
      .header("sec-ch-ua-mobile", "?0")
      .header("sec-ch-ua-platform", "macOS")
      .header("sec-fetch-dest", "empty")
      .header("sec-fetch-mode", "cors")
      .header("sec-fetch-site", "same-origin");

  if let Some(timeout) = args.request_timeout {
    http_request = http_request.timeout(timeout);
  }

  let orientation = match args.orientation {
    Orientation::Portrait => "portrait",
    Orientation::Landscape => "landscape",
  };

  let inpaint_items;

  if let Some(media_ids) = args.image_reference_media_ids {
    inpaint_items = media_ids.iter()
        .map(|item_id| InpaintItem {
          kind: "upload".to_string(),
          upload_id: item_id.to_string(),
        })
        .collect();
  } else {
    inpaint_items = Vec::new();
  }

  let request_body = HttpCreateRequest {
    kind: "video".to_string(),
    prompt: args.prompt.to_string(),
    title: None,
    orientation: orientation.to_string(),
    size: "small".to_string(),
    n_frames: 300,
    inpaint_items,
    cameo_ids: None,
    cameo_replacements: None,
    model: "sy_8".to_string(),
    style_id: None,
    audio_caption: None,
    audio_transcript: None,
    video_caption: None,
    storyboard_id: None,
  };

  let http_request = http_request.json(&request_body).build()
      .map_err(|err| {
        error!("Error building Sora image generation HTTP request: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| {
        error!("Error during Sora image generation request: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  let status = response.status();

  let response_body = &response.text().await
      .map_err(|err| {
        error!("Error reading Sora image generation response body: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  if !status.is_success() {
    error!("Sora image generation request returned an error (code {}) : {:?}", status.as_u16(), response_body);

    return Err(SoraGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body.to_string(),
    }.into());
  }

  let response : HttpCreateResponse = serde_json::from_str(response_body)
      .map_err(|err| SoraGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(GenerateSora2VideoResponse {
    task_id: response.id,
  })
}

#[cfg(test)]
mod tests {
  use crate::requests::generate_sora2_video::generate_sora2_video::{generate_sora2_video, GenerateSora2VideoArgs, Orientation};
  use crate::test_utils::get_test_credentials::get_test_credentials;
  use errors::AnyhowResult;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let creds = get_test_credentials()?;
    let request = GenerateSora2VideoArgs {
      prompt: "A cute corgi wearing glasses, sitting on a picnic blanket and reading a book, digital art",
      credentials: &creds,
      request_timeout: None,
      orientation: Orientation::Landscape,
      image_reference_media_ids: None,
    };
    let result = generate_sora2_video(request).await?;
    println!("result: {:#?}", result);
    assert_eq!(1, 2);
    Ok(())
  }
}
