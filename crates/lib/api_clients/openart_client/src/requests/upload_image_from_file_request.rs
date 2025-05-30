
/* 
curl 'https://openart.ai/api/media/upload_raw_image' --compressed
 -X POST
 -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:138.0) Gecko/20100101 Firefox/138.0'
 -H 'Accept: application/json, text/plain, * / *'
 -H 'Accept-Language: en-US,en;q=0.5'
 -H 'Accept-Encoding: gzip, deflate, br, zstd'
 -H 'X-USER-ID: 6abuz85cRo1iVAmk6Rjf'
 -H 'Content-Type: multipart/form-data; boundary=----geckoformboundary1bbe4d86f5d33a00827b7d293784b7ec'
 -H 'Origin: https://openart.ai'
 -H 'Connection: keep-alive'
 -H 'Referer: https://openart.ai/create?mode=edit&imageAction=changeBackground&action_mode=background_manual_remove'
 -H 'Cookie: AMP_3e2fda7a5c=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJmZmRkZTQ2MS1jMmVlLTRmNmUtYmQwMi0zNDcwYjY1OWNkMTklMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjI2YWJ1ejg1Y1JvMWlWQW1rNlJqZiUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NDg2MTI1MjI4NjglMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzQ4NjEyNTIzMDI4JTJDJTIybGFzdEV2ZW50SWQlMjIlM0EzNzAlMkMlMjJwYWdlQ291bnRlciUyMiUzQTElN0Q=; AMP_MKTG_3e2fda7a5c=JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy5nb29nbGUuY29tJTJGJTIyJTJDJTIycmVmZXJyaW5nX2RvbWFpbiUyMiUzQSUyMnd3dy5nb29nbGUuY29tJTIyJTdE; __client_uat=0; __client_uat_Xt7g_-Hi=0; utm_params={%22utm_source%22:%22organic%22%2C%22utm_medium%22:%22Google%22%2C%22utm_campaign%22:%22oa_unknown%22%2C%22utm_term%22:%22oa_unknown%22%2C%22utm_content%22:%22oa_unknown%22}; themeMode=dark; themeDirection=ltr; themeColorPresets=default; themeLayout=horizontal; themeContrast=default; themeStretch=false; unique_device_id=f1f0b393-815f-4f95-aaa2-65a3b94530f6; __Host-next-auth.csrf-token=ea06d49af6d70cbe0d15774565708d6c394790c5ab2610276bb0bf29a4afb47b%7Cbdbf15d7f2bf44c83586c7ab1ec47ea6c114b26ccc8e20ae45f40f06c0377389; __Secure-next-auth.callback-url=https%3A%2F%2Fopenart.ai%2Fcreate; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..3_1LkfPK4sWQd3GW.KZ7yqoe7fdPEDoTrekIxFIxs5hZVn9Rg8WfsS4tD4Ana6MQmn_LnFhvF-cKAd187Yh3ULWozsFpZAOIQbnndPPsZ5sYu5pYXbQypN5NGC_movTNVQOvzp6nv5r4l0Of1vMslik_wa-LPZZc-blTNGeW-E9Zy35IpK2gHruTAXV_HPfw9uA9OA_RlI3BDxveqnooBdJ1PiU7fJ_MQe6A8Q1XyJ1OtyatXlIBnvrCVuHDPS0ChZbnUA7OTD_d0O8OVyy5yAo-qGer9j_kLg8aC0e-96DUOHq7hwjQyfMDssPVfv1vuArwsZXUThfsb60DGYjDnTIsZlzru-eTghxjrJJuUo7PYRi1A71E4Nu69Ds0.dKUcrC_sRmBDIzp_lew8EQ'
 -H 'Sec-Fetch-Dest: empty'
 -H 'Sec-Fetch-Mode: cors'
 -H 'Sec-Fetch-Site: same-origin'
 -H 'Pragma: no-cache'
 -H 'Cache-Control: no-cache'
 -H 'TE: trailers' --data-binary $'------geckoformboundary1bbe4d86f5d33a00827b7d293784b7ec\r\n
// 
// Content-Disposition: form-data; name="file"; filename="blob"\r\nContent-Type: image/png\r\n\r\n------geckoformboundary1bbe4d86f5d33a00827b7d293784b7ec--\r\n'

{"imageUrl":"https://cdn.openart.ai/production/2025-05/uploads/anonymous/image_A-0v2jOD_1536x1024_1748612534709.png","width":1536,"height":1024}
 */

#[derive(Clone, Debug, Deserialize)]
struct RawUploadResponse {
  #[serde(rename = "imageUrl")]
  image_url: Option<String>,
  width: Option<i64>,
  height: Option<i64>,
}

use crate::creds::openart_credentials::OpenArtCredentials;
use crate::error::client_error::ClientError;
use crate::error::openart_error::OpenArtError;
use log::info;
use reqwest::multipart::{Form, Part};
use reqwest::Client;
use std::path::Path;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tokio::fs::File;
use tokio::io::AsyncReadExt;
use crate::error::api_error::ApiError;
use crate::error::classify_http_error_response::classify_http_error_response;

/// Try to prevent buffer reallocations.
/// There's a better way to implement this.
const INITIAL_BUFFER_SIZE : usize = 1024*1024;

const UPLOAD_URL: &str = "https://openart.ai/api/media/upload_raw_image";

pub async fn upload_image_from_file_request<P: AsRef<Path>>(
  file_path: P, 
  creds: &OpenArtCredentials,
  maybe_timeout: Option<Duration>,
) -> Result<(), OpenArtError> {
  
  let filename = file_path.as_ref().file_name()
      .ok_or_else(|| OpenArtError::Client(ClientError::Other("Could not determine filename from path".to_string())))?
      .to_string_lossy()
      .to_string();

  let mut file = File::open(&file_path)
      .await
      .map_err(|err| OpenArtError::Client(ClientError::IoError(err)))?;
  
  let mut file_bytes = Vec::with_capacity(INITIAL_BUFFER_SIZE);
  
  file.read_to_end(&mut file_bytes)
      .await
      .map_err(|err| OpenArtError::Client(ClientError::IoError(err)))?;

  // TODO: Read file magic bytes first, then fall back to this.
  let mime_type = match file_path.as_ref().extension().and_then(|e| e.to_str()) {
    Some("jpg") | Some("jpeg") => "image/jpeg",
    Some("png") => "image/png",
    // Some("webp") => "image/webp",
    // Some("gif") => "image/gif",
    // Some("mp4") => "video/mp4",
    // Some("mov") => "video/quicktime",
    // Some("webm") => "video/webm",
    _ => "application/octet-stream",
  };

  // Create multipart form
  let part = Part::bytes(file_bytes) // NB: Reqwest needs to own the bytes.
      .file_name(filename) // NB: Reqwest needs to own the bytes
      .mime_str(mime_type)
      .map_err(|err| OpenArtError::Client(ClientError::ReqwestError(err)))?;

  let form = Form::new().part("file", part);

  let cookie = creds.cookies.as_ref()
      .map(|cookies| cookies.to_string())
      .ok_or_else(|| OpenArtError::Client(ClientError::NoCookiesInCredentials))?;
  
  let session_id = creds.session_info.as_ref()
      .map(|info| info.sub.clone())
      .flatten()
      .ok_or_else(|| OpenArtError::Client(ClientError::NoSessionInfoInCredentials))?;

  // Make API request
  let client = Client::new();
  let mut request_builder = client.post(UPLOAD_URL)
      .multipart(form)
      .header("X-USER-ID", session_id)
      .header("Cookie", &cookie);

  if let Some(timeout) = maybe_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder
      .send()
      .await
      .map_err(|err| OpenArtError::Api(ApiError::ReqwestError(err)))?;

  // Check response status
  if !response.status().is_success() {
    info!("Error uploading image: {:?}", response.status());
    let error = classify_http_error_response(response).await;
    return Err(error);
  }

  // Parse response
  let upload_response = response.json::<RawUploadResponse>()
      .await
      .map_err(|err| OpenArtError::Api(ApiError::ReqwestError(err)))?;
  
  println!("Uploaded data: {:?}", upload_response);
  
  Ok(())
}

#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use testing::test_file_path::test_file_path;
  use crate::creds::openart_cookies::OpenArtCookies;
  use crate::creds::openart_credentials::OpenArtCredentials;
  use crate::creds::openart_session_info::OpenArtSessionInfo;
  use crate::requests::get_session_request::{get_session_request, SessionDetails};
  use crate::requests::upload_image_from_file_request::upload_image_from_file_request;

  #[tokio::test]
  #[ignore] // Do not run in CI. Run manully to test session retrieval.
  async fn test() -> AnyhowResult<()> {
    let cookie = "AMP_3e2fda7a5c=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJmZmRkZTQ2MS1jMmVlLTRmNmUtYmQwMi0zNDcwYjY1OWNkMTklMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjI2YWJ1ejg1Y1JvMWlWQW1rNlJqZiUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NDg1ODQyODY0NzclMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzQ4NTg0NTU5NzEyJTJDJTIybGFzdEV2ZW50SWQlMjIlM0EzNjglMkMlMjJwYWdlQ291bnRlciUyMiUzQTklN0Q=; AMP_MKTG_3e2fda7a5c=JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy5nb29nbGUuY29tJTJGJTIyJTJDJTIycmVmZXJyaW5nX2RvbWFpbiUyMiUzQSUyMnd3dy5nb29nbGUuY29tJTIyJTdE; __client_uat=0; __client_uat_Xt7g_-Hi=0; utm_params={%22utm_source%22:%22organic%22%2C%22utm_medium%22:%22Google%22%2C%22utm_campaign%22:%22oa_unknown%22%2C%22utm_term%22:%22oa_unknown%22%2C%22utm_content%22:%22oa_unknown%22}; themeMode=dark; themeDirection=ltr; themeColorPresets=default; themeLayout=horizontal; themeContrast=default; themeStretch=false; unique_device_id=f1f0b393-815f-4f95-aaa2-65a3b94530f6; __Host-next-auth.csrf-token=ea06d49af6d70cbe0d15774565708d6c394790c5ab2610276bb0bf29a4afb47b%7Cbdbf15d7f2bf44c83586c7ab1ec47ea6c114b26ccc8e20ae45f40f06c0377389; __Secure-next-auth.callback-url=https%3A%2F%2Fopenart.ai%2Fcreate; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..mzdySrH34fIj41NP.ky2ZVPIugA1EWSKL29EEEKvSxfG4LCo-R7rN-yLzLo-2LmCrFzVe15BCH2MYg90cwkdIdm1Hi-7U4BcnxG0x662UrU9RDw2yX_ZTZge6Kz70-pg1TaVvKWOS_Gibv8ERSK6MHTfqlx4WNvHccOOfDIWhN87zbLXHCbWnexgmBOB3XfMA96Hby55JNgDM3-_JPcg1lFNkT8oAW562FUZxM9EMzKD4-A4Ee1ZpVd0Z51k4lqfS4XED-0xT6xagsCd6CdwEHEHc0paIAj34Kb_lCO2nyrxGBYvx1XlVHjvXdtakrTqe6jrOuV5rQ0iEO6Xk6cibcZydMV4GssKPEwUDS718AJCxNUK9yHi4RRyfYus.bhvOrrfLdszMcHfJ3Ex2wA";
    
    let mut creds = OpenArtCredentials {
      cookies: Some(OpenArtCookies::new(cookie.to_string())),
      session_info: None,
    };

    let session_details = get_session_request(&creds).await.unwrap();
    
    creds.session_info = Some(OpenArtSessionInfo {
      sub: session_details.sub.clone(),
      email: None,
      name: None,
      image: None,
    });
    
    let image_path = test_file_path("test_data/image/juno.jpg")?; // media_01jqyqgqpwf40tkcapq5bmaz5d
    
    let result = upload_image_from_file_request(image_path, &creds, None).await;
    
    assert!(result.is_ok());
    Ok(())
  }
}