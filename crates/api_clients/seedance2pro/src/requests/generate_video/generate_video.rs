use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use log::info;
use serde_derive::{Deserialize, Serialize};
use wreq::Client;
use wreq_util::Emulation;

const RUN_TASK_URL: &str = "https://seedance2-pro.com/api/trpc/workflow.runTask?batch=1";
const FIREFOX_USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0";

// --- Public enums ---

/// Video resolution / aspect ratio.
#[derive(Debug, Clone, Copy)]
pub enum Resolution {
  /// 16:9 landscape (1280x720)
  Landscape16x9,
  /// 9:16 portrait (720x1280)
  Portrait9x16,
  /// 1:1 square (720x720)
  Square1x1,
  /// 4:3 standard (960x720)
  Standard4x3,
  /// 3:4 portrait (720x960)
  Portrait3x4,
}

impl Resolution {
  fn as_str(&self) -> &'static str {
    match self {
      Self::Landscape16x9 => "1280x720",
      Self::Portrait9x16 => "720x1280",
      Self::Square1x1 => "720x720",
      Self::Standard4x3 => "960x720",
      Self::Portrait3x4 => "720x960",
    }
  }
}

/// Number of videos to generate in a single request.
#[derive(Debug, Clone, Copy)]
pub enum BatchCount {
  One,
  Two,
  Four,
}

impl BatchCount {
  fn as_u8(&self) -> u8 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Four => 4,
    }
  }
}

// --- Request args ---

pub struct GenerateVideoArgs<'a> {
  pub cookie: &'a str,
  pub prompt: String,
  pub resolution: Resolution,
  /// Duration in seconds (4–15).
  pub duration_seconds: u8,
  pub batch_count: BatchCount,
  /// Optional start frame image URL (keyframe mode).
  pub start_frame_url: Option<String>,
  /// Optional end frame image URL (keyframe mode).
  pub end_frame_url: Option<String>,
  /// Reference image URLs (reference mode). Takes priority over start/end frames.
  pub reference_image_urls: Vec<String>,
}

// --- Response ---

pub struct GenerateVideoResponse {
  pub task_id: String,
  pub order_id: String,
  /// Present when batch_count > 1.
  pub task_ids: Option<Vec<String>>,
  /// Present when batch_count > 1.
  pub order_ids: Option<Vec<String>>,
  pub violation_warning: bool,
}

// --- Serde types for the wire format ---

#[derive(Serialize)]
struct BatchRequest {
  #[serde(rename = "0")]
  zero: BatchRequestInner,
}

#[derive(Serialize)]
struct BatchRequestInner {
  json: BatchRequestJson,
}

#[derive(Serialize)]
struct BatchRequestJson {
  #[serde(rename = "businessType")]
  business_type: &'static str,
  #[serde(rename = "apiParams")]
  api_params: ApiParams,
}

#[derive(Serialize)]
struct ApiParams {
  prompt: String,
  resolution: String,
  mode: &'static str,
  model: &'static str,
  duration: String,
  #[serde(rename = "videoInputMode")]
  video_input_mode: &'static str,
  #[serde(rename = "uploadedUrls", skip_serializing_if = "Option::is_none")]
  uploaded_urls: Option<Vec<String>>,
  #[serde(rename = "batchCount", skip_serializing_if = "Option::is_none")]
  batch_count: Option<u8>,
}

#[derive(Deserialize, Debug)]
struct BatchResponseItem {
  result: BatchResponseResult,
}

#[derive(Deserialize, Debug)]
struct BatchResponseResult {
  data: BatchResponseData,
}

#[derive(Deserialize, Debug)]
struct BatchResponseData {
  json: TaskResponseJson,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct TaskResponseJson {
  task_id: String,
  order_id: String,
  task_ids: Option<Vec<String>>,
  order_ids: Option<Vec<String>>,
  violation_warning: bool,
}

// --- Implementation ---

pub async fn generate_video(args: GenerateVideoArgs<'_>) -> Result<GenerateVideoResponse, Seedance2ProError> {
  let is_reference_mode = !args.reference_image_urls.is_empty();

  let video_input_mode = if is_reference_mode { "reference" } else { "keyframe" };

  let uploaded_urls: Option<Vec<String>> = if is_reference_mode {
    Some(args.reference_image_urls)
  } else {
    let mut urls = Vec::new();
    if let Some(url) = args.start_frame_url {
      urls.push(url);
    }
    if let Some(url) = args.end_frame_url {
      urls.push(url);
    }
    if urls.is_empty() { None } else { Some(urls) }
  };

  let batch_count_value = args.batch_count.as_u8();
  let batch_count = if batch_count_value > 1 { Some(batch_count_value) } else { None };

  let duration = format!("{}s", args.duration_seconds);

  info!(
    "Generating video: mode={}, resolution={}, duration={}, batch={}",
    video_input_mode, args.resolution.as_str(), duration, batch_count_value
  );

  let request_body = BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        business_type: "wan22-video-generation",
        api_params: ApiParams {
          prompt: args.prompt,
          resolution: args.resolution.as_str().to_string(),
          mode: "normal",
          model: "seedance-20",
          duration,
          video_input_mode,
          uploaded_urls,
          batch_count,
        },
      },
    },
  };

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let response = client.post(RUN_TASK_URL)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", "https://seedance2-pro.com/")
    .header("Content-Type", "application/json")
    .header("x-trpc-source", "client")
    .header("Origin", "https://seedance2-pro.com")
    .header("Connection", "keep-alive")
    .header("Cookie", args.cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .json(&request_body)
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Response status: {}, body: {}", status, response_body);

  if !status.is_success() {
    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let task_data = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UncategorizedBadResponse(
      "Empty batch response array".to_string()
    ))?
    .result
    .data
    .json;

  Ok(GenerateVideoResponse {
    task_id: task_data.task_id,
    order_id: task_data.order_id,
    task_ids: task_data.task_ids,
    order_ids: task_data.order_ids,
    violation_warning: task_data.violation_warning,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_generate_text_to_video() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let cookie = get_test_cookies()?;
    let args = GenerateVideoArgs {
      cookie: &cookie,
      prompt: "A shiba inu eating a cake in a fancy kitchen.".to_string(),
      resolution: Resolution::Square1x1,
      duration_seconds: 5,
      batch_count: BatchCount::One,
      start_frame_url: None,
      end_frame_url: None,
      reference_image_urls: vec![],
    };
    let result = generate_video(args).await?;
    println!("Task ID: {}", result.task_id);
    println!("Order ID: {}", result.order_id);
    println!("Violation warning: {}", result.violation_warning);
    assert!(!result.task_id.is_empty());
    assert!(!result.order_id.is_empty());
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_generate_keyframe_video() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let cookie = get_test_cookies()?;
    let args = GenerateVideoArgs {
      cookie: &cookie,
      prompt: "A man stands up from his desk and smiles.".to_string(),
      resolution: Resolution::Landscape16x9,
      duration_seconds: 5,
      batch_count: BatchCount::One,
      start_frame_url: Some("https://static.seedance2-pro.com/materials/20260219/test.png".to_string()),
      end_frame_url: None,
      reference_image_urls: vec![],
    };
    let result = generate_video(args).await?;
    println!("Task ID: {}", result.task_id);
    println!("Order ID: {}", result.order_id);
    assert!(!result.task_id.is_empty());
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_generate_reference_video() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let cookie = get_test_cookies()?;
    let args = GenerateVideoArgs {
      cookie: &cookie,
      prompt: "Scenic landscape from @1 with a shiba from @2 wearing glasses.".to_string(),
      resolution: Resolution::Standard4x3,
      duration_seconds: 5,
      batch_count: BatchCount::One,
      start_frame_url: None,
      end_frame_url: None,
      reference_image_urls: vec![
        "https://static.seedance2-pro.com/materials/20260219/test1.png".to_string(),
        "https://static.seedance2-pro.com/materials/20260219/test2.jpg".to_string(),
      ],
    };
    let result = generate_video(args).await?;
    println!("Task ID: {}", result.task_id);
    println!("Order ID: {}", result.order_id);
    assert!(!result.task_id.is_empty());
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
