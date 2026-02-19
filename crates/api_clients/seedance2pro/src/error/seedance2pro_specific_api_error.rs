use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum Seedance2ProSpecificApiError {
  /// The session cookies are expired or invalid.
  UnauthorizedSessionExpired,
}

impl Error for Seedance2ProSpecificApiError {}

impl Display for Seedance2ProSpecificApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::UnauthorizedSessionExpired => write!(f, "Unauthorized: session cookies expired or invalid."),
    }
  }
}
