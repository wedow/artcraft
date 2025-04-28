use std::error::Error;
use std::fmt::{Display, Formatter};
use std::io;

/// The single error type this crate should surface to all callers.
#[derive(Debug)]
pub enum SoraError {
  /// We haven't received a bearer token yet (this is our application error)
  NoBearerTokenAvailable,

  /// We're sending too many tasks to Sora.
  TooManyConcurrentTasks,

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

  /// std::io Error that arises from our end, eg. reading from the filesystem.
  IoError(io::Error),

  /// anyhow::Error arises from our end
  AnyhowError(anyhow::Error),
}

impl Error for SoraError {}

impl Display for SoraError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoBearerTokenAvailable => {
        write!(f, "Unauthorized: no bearer token set")
      }
      Self::TooManyConcurrentTasks => {
        write!(f, "Too many concurrent tasks. Please wait.")
      }
      Self::UnauthorizedCookieOrBearerExpired => {
        write!(f, "Unauthorized: cookie and/or bearer token expired")
      }
      Self::OtherBadStatus(err) => {
        write!(f, "Other error: {}", err)
      }
      Self::ReqwestError(err) => {
        write!(f, "Reqwest error: {}", err)
      }
      Self::IoError(err) => {
        write!(f, "IO error: {}", err)
      }
      Self::AnyhowError(err) => {
        write!(f, "Anyhow error: {}", err)
      }
    }
  }
}

impl From<reqwest::Error> for SoraError {
  fn from(err: reqwest::Error) -> SoraError {
    Self::ReqwestError(err)
  }
}

impl From<io::Error> for SoraError {
  fn from(err: io::Error) -> Self {
    Self::IoError(err)
  }
}

impl From<anyhow::Error> for SoraError {
  fn from(err: anyhow::Error) -> Self {
    Self::AnyhowError(err)
  }
}
