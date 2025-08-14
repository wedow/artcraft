use crate::core::artcraft_error::ArtcraftError;
use base64::DecodeError;
use errors::AnyhowError;
use fal_client::error::fal_error_plus::FalErrorPlus;
use midjourney_client::error::midjourney_error::MidjourneyError;
use openai_sora_client::sora_error::SoraError;
use storyteller_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum InternalImageError {
  NoModelSpecified,
  NoProviderAvailable,
  NeedsFalApiKey,
  NeedsMidjourneyCredentials,
  NeedsSoraCredentials,
  NeedsStorytellerCredentials,
  FalError(FalErrorPlus),
  MidjourneyError(MidjourneyError),
  SoraError(SoraError),
  AnyhowError(AnyhowError),
  StorytellerError(StorytellerError),
  DecodeError(DecodeError),
  IoError(std::io::Error),
  ArtcraftError(ArtcraftError),
}

impl From<AnyhowError> for InternalImageError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<FalErrorPlus> for InternalImageError {
  fn from(value: FalErrorPlus) -> Self {
    Self::FalError(value)
  }
}

impl From<SoraError> for InternalImageError {
  fn from(value: SoraError) -> Self {
    Self::SoraError(value)
  }
}

impl From<StorytellerError> for InternalImageError {
  fn from(value: StorytellerError) -> Self {
    Self::StorytellerError(value)
  }
}

impl From<DecodeError> for InternalImageError {
  fn from(value: DecodeError) -> Self {
    Self::DecodeError(value)
  }
}

impl From<std::io::Error> for InternalImageError {
  fn from(value: std::io::Error) -> Self {
    Self::IoError(value)
  }
}

impl From<ArtcraftError> for InternalImageError {
  fn from(value: ArtcraftError) -> Self {
    match value {
      ArtcraftError::AnyhowError(e) => Self::AnyhowError(e),
      ArtcraftError::DecodeError(e) => Self::DecodeError(e),
      ArtcraftError::IoError(e) => Self::IoError(e),
      ArtcraftError::StorytellerError(e) => Self::StorytellerError(e),
      _ => Self::ArtcraftError(value),
    }
  }
}
