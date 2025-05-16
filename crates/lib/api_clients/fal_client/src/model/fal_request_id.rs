use std::fmt::Display;
use serde::{Deserialize, Serialize};
use crate::model::fal_endpoint::FalEndpoint;

/// A strongly typed request ID for the Fal API.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
pub struct FalRequestId(pub String);

impl Display for FalRequestId {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    Display::fmt(&self.0, f)
  }
}
