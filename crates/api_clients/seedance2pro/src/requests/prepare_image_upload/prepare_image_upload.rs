use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use chrono::Utc;
use log::info;
use rand::Rng;
use serde_derive::{Deserialize, Serialize};
use wreq::Client;
use wreq_util::Emulation;

const SIGNED_UPLOAD_URL: &str = "https://seedance2-pro.com/api/trpc/uploads.signedUploadUrl?batch=1";
const FIREFOX_USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0";

/// Generates a material path based on the current time.
/// Format: `materials/YYYYMMDD/<unix_millis>-<random_hex>.png`
fn generate_material_path() -> String {
  let now = Utc::now();
  let date_part = now.format("%Y%m%d").to_string();
  let timestamp_millis = now.timestamp_millis();
  let random_hex: u32 = rand::rng().random();
  let hex_part = format!("{:08x}", random_hex);
  format!("materials/{}/{}-{}.png", date_part, timestamp_millis, hex_part)
}

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
  path: String,
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
  json: String,
}

pub struct PrepareImageUploadArgs<'a> {
  pub cookie: &'a str,
}

pub struct PrepareImageUploadResponse {
  /// The signed URL to upload the image to (Cloudflare R2 / S3-compatible).
  pub upload_url: String,
  /// The material path that was generated for this upload.
  pub material_path: String,
}

pub async fn prepare_image_upload(args: PrepareImageUploadArgs<'_>) -> Result<PrepareImageUploadResponse, Seedance2ProError> {
  let material_path = generate_material_path();

  info!("Preparing image upload with path: {}", material_path);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let request_body = BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        path: material_path.clone(),
      },
    },
  };

  let response = client.post(SIGNED_UPLOAD_URL)
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

  let upload_url = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UncategorizedBadResponse(
      "Empty batch response array".to_string()
    ))?
    .result
    .data
    .json;

  Ok(PrepareImageUploadResponse {
    upload_url,
    material_path,
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
  async fn test_prepare_image_upload() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let cookie = get_test_cookies()?;
    let args = PrepareImageUploadArgs {
      cookie: &cookie,
    };
    let result = prepare_image_upload(args).await?;
    println!("Upload URL: {}", result.upload_url);
    println!("Material path: {}", result.material_path);
    assert!(!result.upload_url.is_empty());
    assert!(result.upload_url.contains("cloudflarestorage.com"));
    assert!(result.material_path.starts_with("materials/"));
    Ok(())
  }
}
