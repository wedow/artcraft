use log::{debug, error};
use reqwest::Client;
use crate::creds::credentials::Credentials;
use crate::error::client_error::ClientError;
use crate::error::runwayml_error::RunwayMlError;

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
      .build()?;
  
  let response = client.get(GENERATE_URL)
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0")
      .header("Accept", "application/json")
      .header("Accept-Encoding", "gzip, deflate, br")
      .header("Accept-Language", "en-US,en;q=0.5")
      .header("Content-Type", "application/json")
      .header("Authorization", jwt.to_authorization_header_value())
      .send()
      .await?;

  if !response.status().is_success() {
    error!("Failed to generate bearer token: {}", response.status());
    let error = classify_general_http_error(response).await;
    return Err(error);
  }

  debug!("Bearer token generation response was 200.");

  let response_body = response.text().await?;

  debug!("Auth Response: {}", response_body);

  if &response_body == "null" {
    error!("Failed to generate bearer token. Response was `null`.");
    return Err(SoraError::FailedToGenerateBearer)
  }

  let auth_response: SoraAuthResponse = serde_json::from_str(&response_body)?;

  Ok(auth_response.access_token)

  
  
  Ok(())
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