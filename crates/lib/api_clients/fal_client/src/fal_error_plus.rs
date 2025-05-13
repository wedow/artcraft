use std::error::Error;
use std::fmt::{Display, Formatter};

/// Additional errors that aren't included in `fal::FalError`.
#[derive(Debug)]
pub enum FalErrorPlus {
  /// An error arising in the `fal` crate.
  FalError(fal::FalError),
  /// Another error we didn't handle.
  AnyhowError(anyhow::Error),
  /// URL parse errors.
  UrlParseError(url::ParseError),
}

impl Display for FalErrorPlus {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::FalError(err) => write!(f, "FalErrorPlus::FalError: {:?}", err),
      Self::AnyhowError(err) => write!(f, "FalErrorPlus::AnyhowError: {:?}", err),
      Self::UrlParseError(err) => write!(f, "FalErrorPlus::UrlParseError: {:?}", err),
    }
  }
}

impl Error for FalErrorPlus {}

impl From<fal::FalError> for FalErrorPlus {
  fn from(err: fal::FalError) -> Self {
    FalErrorPlus::FalError(err)
  }
}

impl From<anyhow::Error> for FalErrorPlus {
  fn from(err: anyhow::Error) -> Self {
    FalErrorPlus::AnyhowError(err)
  }
}

impl From<url::ParseError> for FalErrorPlus {
  fn from(err: url::ParseError) -> Self {
    FalErrorPlus::UrlParseError(err)
  }
}
