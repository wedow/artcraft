use crate::core::artcraft_error::ArtcraftError;
use anyhow::anyhow;
use base64::DecodeError;
use errors::AnyhowError;
use fal_client::error::fal_error_plus::FalErrorPlus;
use storyteller_client::error::api_error::ApiError;
use storyteller_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum InternalObjectError {
  NoModelSpecified,
  NeedsFalApiKey,
  NeedsSoraCredentials,
  NeedsStorytellerCredentials,
  FalError(FalErrorPlus),
  AnyhowError(AnyhowError),
  StorytellerError(StorytellerError),
  StorytellerApiError(ApiError),
  DecodeError(DecodeError),
  IoError(std::io::Error),
}

impl From<AnyhowError> for InternalObjectError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<FalErrorPlus> for InternalObjectError {
  fn from(value: FalErrorPlus) -> Self {
    Self::FalError(value)
  }
}

impl From<ApiError> for InternalObjectError {
  fn from(value: ApiError) -> Self {
    Self::StorytellerApiError(value)
  }
}

impl From<DecodeError> for InternalObjectError {
  fn from(value: DecodeError) -> Self {
    Self::DecodeError(value)
  }
}

impl From<std::io::Error> for InternalObjectError {
  fn from(value: std::io::Error) -> Self {
    Self::IoError(value)
  }
}

impl From<ArtcraftError> for InternalObjectError {
  fn from(value: ArtcraftError) -> Self {
    match value {
      ArtcraftError::AnyhowError(e) => Self::AnyhowError(e),
      ArtcraftError::DecodeError(e) => Self::DecodeError(e),
      ArtcraftError::IoError(e) => Self::IoError(e),
      ArtcraftError::StorytellerError(e) => Self::StorytellerError(e),
      _ => {
        Self::AnyhowError(anyhow!("Other error: {:?}", value))
      }
    }
  }
}
