use crate::constants::user_agent::USER_AGENT;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::error::sora_specific_api_error::SoraSpecificApiError;
use crate::requests::auth_sentinel::request::GenerateSentinelRefreshRequest;
use crate::requests::auth_sentinel_2::request::SentinelRequest;
use crate::requests::auth_sentinel_2::response::SentinelResponse;
use crate::requests::auth_sentinel_2::sentinel_token::{SentinelResponsePieces, SentinelToken};
use crate::utils_internal::classify_general_http_error::classify_general_http_error;
use errors::AnyhowResult;
use idempotency::uuid::generate_random_uuid;
use log::error;
use serde_derive::{Deserialize, Serialize};
use std::io::Write;
use thiserror::Error;
use wreq::Client;

const SORA_SENTINEL_ENDPOINT: &str = "https://chatgpt.com/backend-api/sentinel/req";



/// This generates a Sentinel Token that works with Sora 1.0 and Sora 2.0 consumer products.
pub async fn generate_sentinel_token_2() -> Result<SentinelToken, SoraError> {
  let (_request, base64_request) = GenerateSentinelRefreshRequest::new().with_fourth_and_tenth();

  let request = SentinelRequest::new(base64_request);
  let client = Client::new();

  let response = client.post(SORA_SENTINEL_ENDPOINT)
      .header("User-Agent", USER_AGENT)
      .header("Content-Type", "application/json")
      .json(&request)
      .send()
      .await
      .map_err(|err| {
        error!("Client failed to generate sentinel token: {:?}", err);
        SoraGenericApiError::WreqError(err)
      })?;
  
  if !response.status().is_success() {
    error!("Failed to generate sentinel: {}", response.status());
    let error = classify_general_http_error(response).await;
    return Err(error);
  }

  let text_body = &response.text().await
      .map_err(|err| {
        error!("sora error reading sentinel token text body: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  println!("Sentinel endpoint response body: {}", text_body);
  std::io::stdout().flush().unwrap();

  let response = serde_json::from_str::<SentinelResponse>(&text_body)
      .map_err(|err| {
        error!("Failed to parse sentinel token response: {}", err);
        SoraGenericApiError::SerdeResponseParseErrorWithBody(err, text_body.to_string())
      })?;

  let response_pieces = sentinel_response_into_pieces(response, text_body)?;

  let sentinel_token = SentinelToken::from_server_request(&request, &response_pieces);

  Ok(sentinel_token)
}


fn sentinel_response_into_pieces(response: SentinelResponse, raw_body: &str) -> Result<SentinelResponsePieces, SoraSpecificApiError> {
  let maybe_turnstile = response.turnstile
      .map(|turn| turn.dx)
      .flatten();

  let mut missing_token = false;
  let mut missing_turnstile  = false;

  match (response.token, maybe_turnstile) {
    (None, None) => {
      missing_token = true;
      missing_turnstile = true;
    }
    (None, Some(_turnstile)) => {
      missing_token = true;
    }
    (Some(_token), None) => {
      missing_turnstile = true;
    }
    (Some(token), Some(turnstile)) => {
      return Ok(SentinelResponsePieces {
        token,
        turnstile_dx: turnstile,
      });
    }
  }

  Err(SoraSpecificApiError::SentinelResponseIsMissingFields {
    missing_token,
    missing_turnstile,
    raw_response: raw_body.to_string(),
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  #[ignore] // Only manually trigger this
  async fn test_generate_token_2() -> AnyhowResult<()> {
    let token = generate_sentinel_token_2().await?;
    println!("{:?}", token);
    assert_eq!(1, 2);
    Ok(())
  }
}