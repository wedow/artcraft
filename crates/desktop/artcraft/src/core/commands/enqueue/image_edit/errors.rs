use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::EnqueueContextualEditImageErrorType;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use errors::AnyhowError;
use openai_sora_client::sora_error::SoraError;
use serde::Serialize;
use storyteller_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum InternalContextualEditImageError {
  /// Request did not specify a model.
  NoModelSpecified,

  /// No provider is configured for the model type.
  NoProviderAvailable,
  
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

  // TODO: Maybe just reuse the other error enum variant
  /// An invalid number of input images was requested for Flux Kontext.
  InvalidNumberOfInputImagesForFluxKontext {
    message: String,
  },

  /// No sora credentials are set.
  NeedsSoraCredentials,
  
  SoraError(SoraError),
  AnyhowError(AnyhowError),
  StorytellerError(StorytellerError),
}

impl From<AnyhowError> for InternalContextualEditImageError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<SoraError> for InternalContextualEditImageError {
  fn from(value: SoraError) -> Self {
    Self::SoraError(value)
  }
}

impl From<StorytellerError> for InternalContextualEditImageError {
  fn from(value: StorytellerError) -> Self {
    Self::StorytellerError(value)
  }
}

impl InternalContextualEditImageError {
  pub fn to_tauri_response<E: Serialize>(&self) -> CommandErrorResponseWrapper<EnqueueContextualEditImageErrorType, E> {
    let mut status = CommandErrorStatus::ServerError;
    let mut error_type = EnqueueContextualEditImageErrorType::ServerError;
    let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.".to_string();
    
    match self {
      InternalContextualEditImageError::NoModelSpecified => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueContextualEditImageErrorType::ModelNotSpecified;
        error_message = "No model specified for image generation".to_string();
      }
      InternalContextualEditImageError::NoProviderAvailable => {
        status = CommandErrorStatus::ServerError;
        error_type = EnqueueContextualEditImageErrorType::NoProviderAvailable;
        error_message = "No configured provider available for image generation".to_string();
      }
      InternalContextualEditImageError::InvalidNumberOfRequestedImages { min, max, requested } => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueContextualEditImageErrorType::BadRequest;
        error_message = format!("Invalid number of images requested ({}). Must be between {} and {}", requested, min, max);
        
      }
      InternalContextualEditImageError::InvalidNumberOfInputImages { min, max, requested } => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueContextualEditImageErrorType::BadRequest;
        error_message = format!("Invalid number of input images ({}). Must be between {} and {}", requested, min, max);
      }
      InternalContextualEditImageError::InvalidNumberOfInputImagesForFluxKontext { message } => {
        status = CommandErrorStatus::BadRequest;
        error_type = EnqueueContextualEditImageErrorType::BadRequest;
        error_message = message.clone();
      }
      InternalContextualEditImageError::SoraError(_) => {}
      InternalContextualEditImageError::AnyhowError(_) => {}
      InternalContextualEditImageError::StorytellerError(_) => {}
      InternalContextualEditImageError::NeedsStorytellerCredentials => {}
      InternalContextualEditImageError::NeedsSoraCredentials => {}
    }
    
    CommandErrorResponseWrapper {
      status,
      error_message: Some(error_message.to_string()),
      error_type: Some(error_type),
      error_details: None,
    }
  }
}