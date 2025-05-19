use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum ApiError {
}

impl Display for ApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    todo!()
  }
}

impl Error for ApiError {}
