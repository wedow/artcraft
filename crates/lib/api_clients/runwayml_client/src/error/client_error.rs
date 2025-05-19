use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum ClientError {
  /// No JWT bearer token in the credentials
  NoJwtBearerToken
}

impl Display for ClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      ClientError::NoJwtBearerToken => write!(f, "No JWT bearer token in the credentials"),
    }
  }
}

impl Error for ClientError {}
