//! tokens
//!
//! The purpose of this library is to have a strongly-typed primary/foreign key system.
//! Every Database or Redis key will have a type here.
//! Well known keys will have short identifiers (eg. "user" is prefixed with "U:")
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

// Crockford characters
// https://en.wikipedia.org/wiki/Base32#Crockford's_Base32
pub(crate) const CROCKFORD_UPPERCASE_CHARSET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";
pub(crate) const CROCKFORD_LOWERCASE_CHARSET: &[u8] = b"0123456789abcdefghjkmnpqrstvwxyz";
pub(crate) const CROCKFORD_MIXED_CASE_CHARSET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz";

pub(crate) enum TokenCharacterSet {
  CrockfordUpper,
  CrockfordLower,
  CrockfordMixed,
}

/// Every token must have at least this many "characters" of entropy.
pub(crate) static MINIMUM_CHARACTER_ENTROPY : usize = 8;

#[macro_use]
mod macros;

pub (crate) mod prefixes;

pub mod files;
pub mod jobs;
pub mod users;
pub mod voice_conversion;
pub mod avt;
