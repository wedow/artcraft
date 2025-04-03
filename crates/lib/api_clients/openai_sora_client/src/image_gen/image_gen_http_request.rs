use anyhow::anyhow;
use serde_derive::{Deserialize, Serialize};
use errors::AnyhowResult;
use crate::credentials::SoraCredentials;

const SORA_IMAGE_GEN_URL: &str = "https://sora.com/backend/video_gen";

/// This user agent is tied to the sentinel generation. If we need to change it, we may need to change sentinel generation too.
const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (crate) enum VideoGenType {
  ImageGen,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (crate) enum OperationType {
  /// Simple prompt without reference images
  SimpleCompose,
  /// Prompt with reference images
  Remix,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (crate) enum InpaintItemType {
  Image,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (crate) struct InpaintItem {
  pub r#type: InpaintItemType,
  /// Typically "0"
  pub frame_index: u32,
  /// Unknown field; defaults to null
  pub preset_id: Option<String>,
  /// Unknown field; defaults to null
  pub generation_id: Option<String>,
  /// Token identifier of the item, eg. "media_01jqt9vt20erx9zvryf3v1pecx"
  pub upload_media_id: String,
  /// Typically "0"
  pub source_start_frame: u32,
  /// Typically "0"
  pub source_end_frame: u32,
  /// Unknown field; defaults to null
  pub crop_bounds: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (crate) struct RawSoraImageGenRequest {
  /// eg. "image_gen"
  pub r#type: VideoGenType,
  /// eg. "simple_compose"
  pub operation: OperationType,
  /// The user's raw prompt
  pub prompt: String,
  /// The number of variants to generate, eg. 2
  pub n_variants: usize,
  /// The width of the image, eg. 480
  pub width: u16,
  /// The height of the image, eg. 480
  pub height: u16,
  /// The number of frames to generate, eg. 1
  pub n_frames: u8,
  /// The items to inpaint, eg. []
  pub inpaint_items: Vec<InpaintItem>,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub (crate) struct RawSoraResponse {
  /// eg. "task_01jqsz9dsae9tvjygf1abrv3xf"
  pub id: String,
  /// not known
  pub priority: Option<String>,
}

// https://sora.com/backend/notif?limit=100&before=task_01jqpg8qghenet0rw2a79p0vbn
// error
// message	"Missing bearer authentication in header"
// type	"invalid_request_error"
// param	null
// code	null
#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (crate) struct RawSoraErrorResponse {
  error: String,
  message: String,
  r#type: String,
  param: Option<String>,
  code: Option<String>,
}

/// Don't expose the internal request implementation as there are only a few "correct" ways to call the API.
pub (crate) async fn image_gen_http_request(sora_request: RawSoraImageGenRequest, credentials: &SoraCredentials) -> AnyhowResult<RawSoraResponse> {
  let client = reqwest::Client::new();

  let sentinel = match credentials.sentinel.as_deref() {
    None => return Err(anyhow!("Calls to image gen require a sentinel in the credentials payload.")),
    Some(sentinel) => sentinel,
  };

  let http_request = client.post(SORA_IMAGE_GEN_URL)
      .header("User-Agent", USER_AGENT)
      .header("Cookie", &credentials.cookie)
      .header("Authorization", credentials.authorization_header_value())
      .header("Content-Type", "application/json")
      .header("OpenAI-Sentinel-Token", sentinel);

  let http_request = http_request.json(&sora_request).build()?;

  let response = client.execute(http_request)
      .await?;

  let status = response.status();

  let response_body = &response.text().await?;

  if status != reqwest::StatusCode::OK {
    return Err(anyhow::anyhow!("the request failed; status = {:?}, message = {:?}", status, response_body));
  }

  let response = serde_json::from_str(response_body)?;

  Ok(response)
}
