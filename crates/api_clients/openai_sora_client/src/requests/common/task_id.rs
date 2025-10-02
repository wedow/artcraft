use std::fmt::Display;
use serde_derive::{Deserialize, Serialize};

/// A strongly typed task ID for Sora tasks.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
pub struct TaskId(pub String);

impl Display for TaskId {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    std::fmt::Display::fmt(&self.0, f)
  }
}
