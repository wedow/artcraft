use crate::creds::fal_api_key::FalApiKey;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::remove_background_rembg::rembg_common::{remove_background_rembg, RemBgResponse};
use fal_client::file_to_base64_url::file_to_base64_url;
use std::path::Path;

/// remove background using `fal_ai/imageutils/rembg`
pub async fn remove_background_rembg_from_file<P: AsRef<Path>>(image_path: P, api_key: &FalApiKey) -> Result<RemBgResponse, FalErrorPlus> {
  let image_url = file_to_base64_url(image_path)?;
  remove_background_rembg(image_url, api_key).await
}
