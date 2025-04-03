use serde_derive::{Deserialize, Serialize};
use errors::AnyhowResult;
use crate::credentials::SoraCredentials;

const URL : &str = "https://sora.com/backend/video_gen";


// https://sora.com/backend/notif?limit=100&before=task_01jqpg8qghenet0rw2a79p0vbn

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub enum VideoGenType {
  ImageGen,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub enum OperationType {
  /// Simple prompt without reference images
  SimpleCompose,
  /// Prompt with reference images
  Remix,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub enum InpaintItemType {
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
  type_: String,
  param: Option<String>,
  code: Option<String>,
}


const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

pub (crate) async fn call_sora_image_gen(request: RawSoraImageGenRequest, credentials: &SoraCredentials) -> AnyhowResult<RawSoraResponse> {
  let client = reqwest::Client::new();

  let request_payload = serde_json::to_string(&request)?;

  println!("\n\n >>> request_payload = {:?}", request_payload);

  //let request = credentials.add_credential_headers_to_request(request);

  let request= client.post(URL)
      .header("OpenAI-Sentinel-Token", &credentials.sentinel)
      .header("User-Agent", USER_AGENT)
      .header("Cookie", &credentials.cookie)
      .header("Authorization", &credentials.bearer_token)
      .header("Content-Type", "application/json");

  let response = request.json(&request_payload)
      .send()
      .await?;
      //.error_for_status()?;

  println!("\n\n >>> status = {:?}", response.status());

  let json_response = &response.text().await?;

  println!(" >>> response = {:?}", json_response);

  let response = serde_json::from_str(json_response)?;

  Ok(response)
}
