use crate::errors::provider_error::ProviderError;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum ArtcraftRouterError {
  /// The requested model is not yet supported by the router.
  UnsupportedModel(String),

  /// Invalid or missing input arguments.
  InvalidInput(String),

  /// An error from an underlying provider.
  Provider(ProviderError),
}

impl Error for ArtcraftRouterError {}

impl Display for ArtcraftRouterError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::UnsupportedModel(model) => write!(f, "Unsupported model: {}", model),
      Self::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
      Self::Provider(e) => write!(f, "Provider error: {}", e),
    }
  }
}

impl From<ProviderError> for ArtcraftRouterError {
  fn from(error: ProviderError) -> Self {
    Self::Provider(error)
  }
}
