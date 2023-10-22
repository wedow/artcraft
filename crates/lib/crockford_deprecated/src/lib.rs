//! crockford
//!
//! The purpose of this library is to generate entropy and crockford encode it.
//!

// Never allow these
#![forbid(private_in_public)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
#![forbid(unreachable_patterns)]
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

pub use crockford_entropy::crockford_entropy_lower;
// Re-export
pub use crockford_entropy::crockford_entropy_upper;

/// Crockford characters (uppercase)
const CROCKFORD_UPPERCASE_CHARSET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/// Crockford characters (lowercase)
const CROCKFORD_LOWERCASE_CHARSET: &[u8] = b"0123456789abcdefghjkmnpqrstvwxyz";

mod crockford_entropy;

