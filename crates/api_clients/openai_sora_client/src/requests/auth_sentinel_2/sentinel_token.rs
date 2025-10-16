use crate::error::sora_client_error::SoraClientError;
use crate::requests::auth_sentinel_2::request::SentinelRequest;
use serde_derive::{Deserialize, Serialize};

// TODO: Refactor + support more
const SENTINEL_FLOW: &str = "sora_init";

#[derive(Debug, Serialize, Deserialize)]
pub struct SentinelToken {
  /// "Proof of Work" token (we generated this)
  #[serde(rename = "p")]
  pub p: String,

  /// Random UUID (we generated this)
  #[serde(rename = "id")]
  pub id: String,

  /// Frontend UI flow (this is the website flow used)
  #[serde(rename = "flow")]
  pub flow: String,

  /// Turnstile dx from the response.
  /// response["turnstile"]["dx"]
  #[serde(rename = "t")]
  pub t: String,

  /// Token from the response.
  /// response["token"]
  #[serde(rename = "c")]
  pub c: String,
}

/// The important parts of the sentinel endpoint response.
pub (crate) struct SentinelResponsePieces {
  pub token: String,
  pub turnstile_dx: String,
}

impl SentinelToken {
  pub fn from_server_request(request: &SentinelRequest, response: &SentinelResponsePieces) -> Self {
    Self {
      p: request.p.clone(),
      id: request.id.clone(),
      flow: request.flow.clone(),
      t: response.turnstile_dx.clone(),
      c: response.token.clone(),
    }
  }

  pub fn to_json(&self) -> Result<String, SoraClientError> {
    serde_json::to_string(self)
        .map_err(|err| SoraClientError::CouldNotSerializeSentinelToken(err))
  }
}
