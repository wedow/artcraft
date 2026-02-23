use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, Copy)]
pub enum ClientType {
  Artcraft,
}

impl Display for ClientType {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Artcraft => write!(f, "Artcraft"),
    }
  }
}

#[derive(Debug)]
pub enum ClientError {
  /// The requested client is not configured on the RouterClient.
  ClientNotConfigured(ClientType),
}

impl Error for ClientError {}

impl Display for ClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::ClientNotConfigured(client_type) => {
        write!(f, "{} client is not configured on the RouterClient", client_type)
      }
    }
  }
}
