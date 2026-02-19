use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum Seedance2ProClientError {
  /// No cookies are present in the session.
  NoCookiesPresent,

  /// An error was encountered in building the Wreq client.
  WreqClientError(wreq::Error),
}

impl Error for Seedance2ProClientError {}

impl Display for Seedance2ProClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoCookiesPresent => write!(f, "No cookies present in the session."),
      Self::WreqClientError(err) => write!(f, "Wreq client error (during client creation): {}", err),
    }
  }
}
