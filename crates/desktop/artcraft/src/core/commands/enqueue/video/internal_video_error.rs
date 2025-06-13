use base64::DecodeError;
use errors::AnyhowError;
use fal_client::error::fal_error_plus::FalErrorPlus;
use storyteller_client::error::api_error::ApiError;
use storyteller_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum InternalVideoError {
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

impl From<AnyhowError> for InternalVideoError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<FalErrorPlus> for InternalVideoError {
  fn from(value: FalErrorPlus) -> Self {
    Self::FalError(value)
  }
}

impl From<ApiError> for InternalVideoError {
  fn from(value: ApiError) -> Self {
    Self::StorytellerApiError(value)
  }
}

impl From<DecodeError> for InternalVideoError {
  fn from(value: DecodeError) -> Self {
    Self::DecodeError(value)
  }
}

impl From<std::io::Error> for InternalVideoError {
  fn from(value: std::io::Error) -> Self {
    Self::IoError(value)
  }
}
