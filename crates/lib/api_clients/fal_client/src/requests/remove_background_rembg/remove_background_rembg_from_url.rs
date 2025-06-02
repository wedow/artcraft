use crate::creds::fal_api_key::FalApiKey;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::remove_background_rembg::rembg_common::{remove_background_rembg, RemBgResponse};

pub async fn remove_background_rembg_from_url(url: String, api_key: &FalApiKey) -> Result<RemBgResponse, FalErrorPlus> {
  remove_background_rembg(url, api_key).await
}
