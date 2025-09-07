use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum SelectOptionalRecordError {
  DatabaseError(sqlx::Error),
}

impl Error for SelectOptionalRecordError {}

impl Display for SelectOptionalRecordError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      SelectOptionalRecordError::DatabaseError(e) => write!(f, "Database error: {}", e),
    }
  }
}

impl From<sqlx::Error> for SelectOptionalRecordError {
  fn from(e: sqlx::Error) -> Self {
    SelectOptionalRecordError::DatabaseError(e)
  }
}
