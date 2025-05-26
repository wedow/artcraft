//! A wrapper for the "fal" crate that bakes in a few extra recipes and utilities.

extern crate fal;

// Re-export
pub mod export {
  pub use fal::*;
}

pub mod creds;
pub mod error;
pub mod model;
pub mod requests;
pub mod utils;
