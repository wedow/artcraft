use crate::error::api_error::ApiError;
use crate::error::openart_error::OpenArtError;

/// This assumes the request failed and returned a non-200.
/// The caller should check.
pub async fn classify_http_error_response(response: reqwest::Response) -> OpenArtError {
  let status = response.status();
  let message = match response.text().await {
    Ok(text) => text,
    Err(err) => return OpenArtError::Api(ApiError::ReqwestError(err)),
  };
  
  // TODO: Handle various error messages from the API.

  OpenArtError::Api(ApiError::UncategorizedBadResponse { status_code: status, message })
}
