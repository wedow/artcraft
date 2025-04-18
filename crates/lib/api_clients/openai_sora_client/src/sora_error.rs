use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum SoraError {
  /// Unauthorized, cookie and/or bearer token expired. We'll need to ask for a refreshed login.
  ///
  /// Example message, e.g. from the upload endpoint:
  ///   {
  ///     "error": {
  ///       "message": "Your authentication token has expired. Please try signing in again.",
  ///       "type": "invalid_request_error",
  ///       "param": null,
  ///       "code": "token_expired"
  ///     }
  ///   }
  UnauthorizedCookieOrBearerExpired,

  /// Another error occurred.
  OtherBadStatus(anyhow::Error),

  /// Reqwest Error
  ReqwestError(reqwest::Error),
}

impl Error for SoraError {}

impl Display for SoraError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      SoraError::UnauthorizedCookieOrBearerExpired => {
        write!(f, "Unauthorized: cookie and/or bearer token expired")
      }
      SoraError::OtherBadStatus(err) => {
        write!(f, "Other error: {}", err)
      }
      SoraError::ReqwestError(err) => {
        write!(f, "Reqwest error: {}", err)
      }
    }
  }
}

impl From<reqwest::Error> for SoraError {
  fn from(err: reqwest::Error) -> SoraError {
    SoraError::ReqwestError(err)
  }
}
