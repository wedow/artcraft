use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum ClientError {
}

impl Display for ClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    todo!()
  }
}

impl Error for ClientError {}
