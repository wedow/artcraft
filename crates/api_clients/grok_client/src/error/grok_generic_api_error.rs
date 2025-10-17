use cloudflare_errors::cloudflare_error::CloudflareError;
use std::error::Error;
use std::fmt::{Display, Formatter};
use wreq::StatusCode;

#[derive(Debug)]
pub enum GrokGenericApiError {
  /// Specific Cloudflare errors.
  CloudflareError(CloudflareError),

  /// serde_json::Error, likely from JSON deserialization schema mismatch.
  /// Includes the original body.
  SerdeResponseParseErrorWithBody(serde_json::Error, String),

  /// serde_json::Error, likely from JSON deserialization schema mismatch.
  /// Includes the original body.
  /// Specifically, this is for non-200 (error) responses.
  SerdeParseErrorWithBodyOnNon200(serde_json::Error, String),

  /// An uncategorized bad HTTP response from Grok.
  UncategorizedBadResponseWithStatusAndBody {
    status_code: StatusCode,
    body: String,
  },

  /// An uncaught error from the API client.
  WreqError(wreq::Error),
}

impl Error for GrokGenericApiError {}

impl Display for GrokGenericApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::CloudflareError(err) => write!(f, "Cloudflare error: {}", err),
      Self::SerdeResponseParseErrorWithBody(err, body) => write!(f, "Failed to parse response body: {:?}. Body: {}", err, body),
      Self::SerdeParseErrorWithBodyOnNon200(err, body) => write!(f, "Failed to parse non-200 response body: {:?}. Body: {}", err, body),
      Self::UncategorizedBadResponseWithStatusAndBody { status_code, body } => write!(f, "Uncategorized bad response: status code {}, body: {}", status_code, body),
      Self::WreqError(err) => write!(f, "Wreq client error: {}", err),
    }
  }
}
