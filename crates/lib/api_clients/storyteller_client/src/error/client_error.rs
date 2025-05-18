use std::error::Error;
use std::fmt::{Display, Formatter};
use std::io;
use std::path::PathBuf;

/// An error arising from the client, either before or after the request is sent.
#[derive(Debug)]
pub enum ClientError {
  /// Could not determine the filetype for the file.
  FileTypeNotKnown(PathBuf),

  /// Could not handle the file type.
  FileTypeNotHandled(PathBuf),

  /// An error doing file I/O (on our side)
  IoError(io::Error),
}

impl Error for ClientError {}

impl Display for ClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::FileTypeNotKnown(path) => write!(f, "Could not determine the filetype for the file: {:?}", path),
      Self::FileTypeNotHandled(path) => write!(f, "Could not handle the file type for the file: {:?}", path),
      Self::IoError(err) => write!(f, "IO error: {}", err),
    }
  }
}

impl From<io::Error> for ClientError {
  fn from(error: io::Error) -> Self {
    ClientError::IoError(error)
  }
}
