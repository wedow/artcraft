use std::error::Error;
use std::fmt::{Debug, Display, Formatter};


/// Implement this marker trait for subtypes.
pub trait CrateError : Error + Debug + Display {}

#[derive(Debug)]
pub struct MysqlError<E: CrateError> {
  /// Inner error type
  pub inner: E
}

impl <E> Error for MysqlError <E> where E: CrateError {}

impl <E> Display for MysqlError<E> where E: CrateError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "MysqlError: {}", self.inner)
  }
}

// impl From<UpsertError> for MysqlError<UpsertError> {
//   fn from(value: UpsertError) -> Self {
//     MysqlError { inner: value }
//   }
// }
