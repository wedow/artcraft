use crate::creds::credentials::Credentials;
use crate::error::api_error::ApiError;
use crate::error::classify_http_error_response::classify_http_error_response;
use crate::error::client_error::ClientError;
use crate::error::runwayml_error::RunwayMlError;
use log::{debug, error};
use reqwest::Client;

const GENERATE_URL: &str = "https://api.runwayml.com/v1/tasks";

pub async fn gen4_image_to_video(
  credentials: &Credentials,
) -> Result<String, RunwayMlError> {
  
  let jwt = match credentials.jwt_bearer_token.as_ref() {
    Some(token) => token,
    None => {
      error!("Failed to generate bearer token. No JWT bearer token found.");
      return Err(ClientError::NoJwtBearerToken.into());
    }
  };
  
  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| {
        error!("Failed to create HTTP client: {}", err);
        RunwayMlError::Client(ClientError::ReqwestError(err))
      })?;
  
  let response = client.post(GENERATE_URL)
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0")
      .header("Accept", "application/json")
      .header("Accept-Encoding", "gzip, deflate, br")
      .header("Accept-Language", "en-US,en;q=0.5")
      .header("Content-Type", "application/json")
      .header("Authorization", jwt.to_authorization_header_value())
      .send()
      .await
      .map_err(|err| {
        error!("Failed to send request: {}", err);
        RunwayMlError::Api(ApiError::ReqwestError(err))
      })?;

  if !response.status().is_success() {
    error!("Image to video request failed: {}", response.status());
    let error = classify_http_error_response(response).await;
    return Err(error);
  }

  debug!("Enqueue returned a 200.");

  let response_body = response
      .text()
      .await
      .map_err(|err| {
        RunwayMlError::Api(ApiError::ReqwestError(err))
      })?;

  debug!("Auth Response: {}", response_body);

  //if &response_body == "null" {
  //  error!("Failed to generate bearer token. Response was `null`.");
  //  return Err(SoraError::FailedToGenerateBearer)
  //}

  let auth_response: SoraAuthResponse = serde_json::from_str(&response_body)?;

  Ok(auth_response.access_token)
}
 
#[cfg(test)]
mod tests {
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore]
  async fn send_test_request() -> AnyhowResult<()> {
    Ok(())
  }
}