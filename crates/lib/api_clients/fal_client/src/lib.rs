//! A wrapper for the "fal" crate that bakes in a few extra recipes and utilities.

// Re-export
extern crate fal;


pub mod creds;
pub mod fal_error_plus;
pub mod requests;
pub mod utils;
