use crate::core::commands::enqueue::image_inpaint::enqueue_image_inpaint_command::EnqueueInpaintImageErrorType;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use errors::AnyhowError;
use serde::Serialize;
use storyteller_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum InternalImageInpaintError {
  /// Request did not specify a model.
  NoModelSpecified,

  /// No provider is configured for the model type.
  NoProviderAvailable,

  /// A source image was not provided
  NoSourceImageSpecified,
  
  /// A mask image was not provided
  NoMaskImageSpecified,

  /// Both mask image media token and raw bytes were supplied.
  MaskMediaTokenAndBytesSupplied,

  /// Mask image has an unknown MIME type.
  CouldNotDetermineMaskMimeType,

  /// Could not encode the mask image to PNG.
  CouldNotEncodeMask,

  /// No storyteller credentials are set.
  NeedsStorytellerCredentials,
  
  /// An invalid number of images was requested.
  InvalidNumberOfRequestedImages {
    min: u32,
    max: u32,
    requested: u32,
  },
  
  /// An invalid number of input images was requested.
  InvalidNumberOfInputImages {
    min: u32,
    max: u32,
    requested: u32,
  },
  
  AnyhowError(AnyhowError),
  StorytellerError(StorytellerError),
}

impl From<AnyhowError> for InternalImageInpaintError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<StorytellerError> for InternalImageInpaintError {
  fn from(value: StorytellerError) -> Self {
    Self::StorytellerError(value)
  }
}

impl InternalImageInpaintError {
}