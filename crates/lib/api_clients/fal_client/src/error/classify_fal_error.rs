use crate::error::fal_error_plus::FalErrorPlus;

/// Better classify the `fal::FalError` into a more user-friendly `FalErrorPlus`.
pub fn classify_fal_error(err: fal::FalError) -> FalErrorPlus {
  match err {
    fal::FalError::RequestError(_) => FalErrorPlus::FalError(err),
    fal::FalError::ImageError(_) => FalErrorPlus::FalError(err),
    fal::FalError::SerializeError(_) => FalErrorPlus::FalError(err),
    fal::FalError::StreamError(_) => FalErrorPlus::FalError(err),
    fal::FalError::Other(ref inner) => {
      if inner.contains("Invalid Key Authorization header format") {
        FalErrorPlus::FalApiKeyError(inner.to_string())
      } else if inner.contains("No user found for Key ID and Secret") {
        FalErrorPlus::FalApiKeyError(inner.to_string())
      } else {
        FalErrorPlus::FalError(err)
      }
    }
  }
}
