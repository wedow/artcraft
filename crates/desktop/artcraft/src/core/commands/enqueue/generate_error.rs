use crate::core::artcraft_error::ArtcraftError;
use base64::DecodeError;
use errors::AnyhowError;
use fal_client::error::fal_error_plus::FalErrorPlus;
use midjourney_client::error::midjourney_error::MidjourneyError;
use openai_sora_client::sora_error::SoraError;
use storyteller_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum GenerateError {
  BadInput(BadInputReason),
  MissingCredentials(MissingCredentialsReason),
  ProviderFailure(ProviderFailureReason),

  /// We couldn't find a provider to dispatch the request to.
  NoProviderAvailable,

  /// There was a billing, credits, or payments issue.
  BillingIssue(BillingIssueReason),

  /// The feature is not yet implemented.
  NotYetImplemented(String),

  // Misc error buckets
  AnyhowError(AnyhowError),
  DecodeError(DecodeError),
  IoError(std::io::Error),
}

#[derive(Debug)]
pub enum BadInputReason {
  NoModelSpecified,
  /// An image was required but not provided.
  ImageMissing,
  Base64DecodeError,
}

#[derive(Debug)]
pub enum MissingCredentialsReason {
  NeedsFalApiKey,
  NeedsMidjourneyCredentials,
  NeedsMidjourneyUserId,
  NeedsMidjourneyUserInfo,
  NeedsSoraCredentials,
  NeedsStorytellerCredentials,
}

#[derive(Debug)]
pub struct BillingIssueReason {
  pub provider: BillingProvider,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum BillingProvider {
  Fal,
  Midjourney,
  Sora,
  Storyteller,
}

#[derive(Debug)]
pub enum ProviderFailureReason {
  Fal(FalErrorPlus),
  MidjourneyError(MidjourneyError),
  /// NB: The midjourney client doesn't categorize all errors, so we have to do so on our end.
  MidjourneyJobEnqueueFailed,
  SoraError(SoraError),
  StorytellerError(StorytellerError),
}

impl GenerateError {
  
  //
  // Bad input
  // 
  
  pub fn no_model_specified() -> Self {
    Self::BadInput(BadInputReason::NoModelSpecified)
  }
  
  //
  // Missing credentials
  //
  
  pub fn needs_fal_api_key() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsFalApiKey)
  }

  pub fn needs_midjourney_credentials() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsMidjourneyCredentials)
  }

  pub fn needs_sora_credentials() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsSoraCredentials)
  }

  pub fn needs_storyteller_credentials() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials)
  }
}

impl From<AnyhowError> for GenerateError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<ArtcraftError> for GenerateError {
  fn from(value: ArtcraftError) -> Self {
    match value {
      ArtcraftError::AnyhowError(e) => Self::AnyhowError(e),
      ArtcraftError::DecodeError(e) => Self::DecodeError(e),
      ArtcraftError::IoError(e) => Self::IoError(e),
      ArtcraftError::StorytellerError(e) => Self::ProviderFailure(ProviderFailureReason::StorytellerError(e)),
    }
  }
}

impl From<FalErrorPlus> for GenerateError {
  fn from(value: FalErrorPlus) -> Self {
    Self::ProviderFailure(ProviderFailureReason::Fal(value))
  }
}

impl From<MidjourneyError> for GenerateError {
  fn from(value: MidjourneyError) -> Self {
    Self::ProviderFailure(ProviderFailureReason::MidjourneyError(value))
  }
}

impl From<SoraError> for GenerateError {
  fn from(value: SoraError) -> Self {
    Self::ProviderFailure(ProviderFailureReason::SoraError(value))
  }
}

impl From<StorytellerError> for GenerateError {
  fn from(value: StorytellerError) -> Self {
    Self::ProviderFailure(ProviderFailureReason::StorytellerError(value))
  }
}
