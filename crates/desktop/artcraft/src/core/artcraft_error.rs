use grok_client::error::grok_error::GrokError;
use std::error::Error;
use std::fmt::{Display, Formatter};
use storyteller_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum ArtcraftError {
  AnyhowError(anyhow::Error),
  DecodeError(base64::DecodeError),
  IoError(std::io::Error),
  // Service errors
  GrokError(GrokError),
  StorytellerError(StorytellerError),
}

impl Error for ArtcraftError {}

impl Display for ArtcraftError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::AnyhowError(e) => write!(f, "AnyhowError: {:?}", e),
      Self::DecodeError(e) => write!(f, "DecodeError: {:?}", e),
      Self::IoError(e) => write!(f, "IoError: {:?}", e),
      Self::GrokError(e) => write!(f, "GrokError: {:?}", e),
      Self::StorytellerError(e) => write!(f, "StorytellerError: {:?}", e),
    }
  }
}

impl From<anyhow::Error> for ArtcraftError {
  fn from(value: anyhow::Error) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<base64::DecodeError> for ArtcraftError {
  fn from(value: base64::DecodeError) -> Self {
    Self::DecodeError(value)
  }
}

impl From<std::io::Error> for ArtcraftError {
  fn from(value: std::io::Error) -> Self {
    Self::IoError(value)
  }
}

impl From<GrokError> for ArtcraftError {
  fn from(value: GrokError) -> Self {
    Self::GrokError(value)
  }
}

impl From<StorytellerError> for ArtcraftError {
  fn from(value: StorytellerError) -> Self {
    Self::StorytellerError(value)
  }
}

