use crate::core::artcraft_error::ArtcraftError;
use base64::DecodeError;
use errors::AnyhowError;
use fal_client::error::fal_error_plus::FalErrorPlus;
use midjourney_client::error::midjourney_error::MidjourneyError;
use openai_sora_client::sora_error::SoraError;
use storyteller_client::error::storyteller_error::StorytellerError;
use crate::core::commands::enqueue::text_to_image::internal_image_error::InternalImageError;

#[derive(Debug)]
pub enum GenerateError {
  BadInput(BadInputReason),
  MissingCredentials(MissingCredentialsReason),
  ProviderFailure(ProviderFailure),

  /// We couldn't find a provider to dispatch the request to.
  NoProviderAvailable,

  /// There was a billing, credits, or payments issue.
  BillingIssue,

  /// The feature is not yet implemented.
  NotYetImplemented(String),

  // Misc error buckets
  ArtcraftError(ArtcraftError),
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
pub enum ProviderFailure {
  Fal(FalErrorPlus),
  MidjourneyError(MidjourneyError),
  /// NB: The midjourney client doesn't categorize all errors, so we have to do so on our end.
  MidjourneyJobEnqueueFailed,
  SoraError(SoraError),
  StorytellerError(StorytellerError),
}

impl From<AnyhowError> for GenerateError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}
