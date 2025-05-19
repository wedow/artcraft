use jwt_light::error::JwtError;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum ApiError {
  /// Inability to parse JWT.
  JwtError(JwtError),
}

impl Display for ApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      ApiError::JwtError(err) => write!(f, "JwtError: {}", err),
    }
  }
}

impl Error for ApiError {}

impl From<JwtError> for ApiError {
  fn from(err: JwtError) -> Self {
    ApiError::JwtError(err)
  }
}
