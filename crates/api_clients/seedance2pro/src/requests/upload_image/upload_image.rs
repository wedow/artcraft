use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

const FIREFOX_USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0";

pub struct UploadImageArgs {
  /// The signed upload URL returned by `prepare_image_upload`.
  pub upload_url: String,

  /// The raw image bytes to upload.
  pub image_bytes: Vec<u8>,
}

pub async fn upload_image(args: UploadImageArgs) -> Result<(), Seedance2ProError> {
  info!("Uploading image to: {}", args.upload_url);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let response = client.put(&args.upload_url)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", "https://seedance2-pro.com/")
    .header("Origin", "https://seedance2-pro.com")
    .header("Connection", "keep-alive")
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "cross-site")
    .header("Priority", "u=4")
    .body(args.image_bytes)
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();

  info!("Upload response status: {}", status);

  if !status.is_success() {
    let body = response.text()
      .await
      .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body,
    }.into());
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use crate::requests::prepare_image_upload::prepare_image_upload::{
    prepare_image_upload, PrepareImageUploadArgs,
  };
  use errors::AnyhowResult;
  use log::LevelFilter;
  use std::fs;

  #[tokio::test]
  #[ignore] // manually test — requires real cookies and a test image
  async fn test_upload_image() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);

    // Step 1: Get a signed upload URL
    let cookie = get_test_cookies()?;
    let prepare_args = PrepareImageUploadArgs {
      cookie: &cookie,
    };
    let prepare_result = prepare_image_upload(prepare_args).await?;
    println!("Upload URL: {}", prepare_result.upload_url);

    // Step 2: Read a test image
    let image_bytes = fs::read("/Users/bt/dev/storyteller/artcraft/test_data/image/juno.jpg")?;
    println!("Image size: {} bytes", image_bytes.len());

    // Step 3: Upload
    let upload_args = UploadImageArgs {
      upload_url: prepare_result.upload_url,
      image_bytes,
    };
    upload_image(upload_args).await?;
    println!("Upload succeeded!");

    assert_eq!(1, 2);

    Ok(())
  }
}
