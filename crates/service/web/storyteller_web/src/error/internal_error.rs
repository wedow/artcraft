use std::error::Error;
use std::fmt::{Debug, Display, Formatter};

/// Any generic errors arising internally.
/// An error class that we do not expose via the API.
/// This should be massaged before we send it to the user.
#[derive(Debug)]
pub enum InternalError {
  /// Issue with HMAC decoding
  /// This is typically when using development cookies against production,
  /// or vice versa.
  VisitorCookieError(String),
  
  /// Decode error with AVT cookie missing a required field.
  VisitorCookieMissingField(&'static str),

  /// Catch instances of anyhow::Error.
  AnyhowError(anyhow::Error),
}

impl Error for InternalError {}

impl Display for InternalError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      InternalError::VisitorCookieError(reason) => write!(f, "Visitor cookie error: {:?}", reason),
      InternalError::VisitorCookieMissingField(field) => write!(f, "Visitor cookie missing field: {}", field),
      InternalError::AnyhowError(err) => write!(f, "Anyhow error: {}", err),
    }
  }
}

impl From<anyhow::Error> for InternalError {
  fn from(err: anyhow::Error) -> Self {
    InternalError::AnyhowError(err)
  }
}
