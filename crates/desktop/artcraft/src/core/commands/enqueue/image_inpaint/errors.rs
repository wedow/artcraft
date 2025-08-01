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
  pub fn to_tauri_response<E: Serialize>(&self) -> CommandErrorResponseWrapper<EnqueueInpaintImageErrorType, E> {
    let mut status = CommandErrorStatus::ServerError;
    let mut error_type = EnqueueInpaintImageErrorType::ServerError;
    let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.".to_string();
    
    match self {
      InternalImageInpaintError::NoModelSpecified => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueInpaintImageErrorType::ModelNotSpecified;
        error_message = "No model specified for image generation".to_string();
      }
      InternalImageInpaintError::NoProviderAvailable => {
        status = CommandErrorStatus::ServerError;
        error_type = EnqueueInpaintImageErrorType::NoProviderAvailable;
        error_message = "No configured provider available for image generation".to_string();
      }
      InternalImageInpaintError::NoSourceImageSpecified => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueInpaintImageErrorType::NoSourceImageSpecified;
        error_message = "No source image was provided".to_string();
      }
      InternalImageInpaintError::NoMaskImageSpecified => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueInpaintImageErrorType::NoMaskImageSpecified;
        error_message = "No mask image was provided".to_string();
      }
      InternalImageInpaintError::MaskMediaTokenAndBytesSupplied => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueInpaintImageErrorType::MultipleMaskImagesSpecified;
        error_message = "multiple mask images provided".to_string();
      }
      InternalImageInpaintError::CouldNotDetermineMaskMimeType => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueInpaintImageErrorType::BadMaskImage;
        error_message = "bad mask image (mime)".to_string();
      }
      InternalImageInpaintError::CouldNotEncodeMask => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueInpaintImageErrorType::BadMaskImage;
        error_message = "bad mask image (encode)".to_string();
      }
      InternalImageInpaintError::InvalidNumberOfRequestedImages { min, max, requested } => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueInpaintImageErrorType::BadRequest;
        error_message = format!("Invalid number of images requested ({}). Must be between {} and {}", requested, min, max);
        
      }
      InternalImageInpaintError::InvalidNumberOfInputImages { min, max, requested } => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueInpaintImageErrorType::BadRequest;
        error_message = format!("Invalid number of input images ({}). Must be between {} and {}", requested, min, max);
      }
      InternalImageInpaintError::AnyhowError(_) => {}
      InternalImageInpaintError::StorytellerError(_) => {}
      InternalImageInpaintError::NeedsStorytellerCredentials => {}
    }
    
    CommandErrorResponseWrapper {
      status,
      error_message: Some(error_message.to_string()),
      error_type: Some(error_type),
      error_details: None,
    }
  }
}