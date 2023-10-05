// Copyright (c) 2020 Brandon Thomas <bt@brand.io>

//! Very simple helper functions for environment variables and environment variable-driven
//! `env_logger` configuration.

#![deny(dead_code)]
#![deny(missing_docs)]
#![deny(unreachable_patterns)]
#![deny(unused_extern_crates)]
#![deny(unused_imports)]
#![deny(unused_qualifications)]
#![deny(unused_qualifications)]


use std::error::Error;
use std::fmt::{Display, Debug, Formatter};
use std::{env, fmt};

mod boolean;
mod duration;
mod pathbuf;
mod string;
mod num;

/// Name of the environment variable Rust's env logger uses
pub const ENV_RUST_LOG : &str = "RUST_LOG";

const DEFAULT_LOG_LEVEL: &str = "info";

/// Errors with env variables.
#[derive(Debug)]
pub enum EnvError {
  /// The environment variable value is not unicode.
  NotUnicode,
  /// Problem parsing the env variable as the desired type.
  ParseError {
    /// Explanation of the parsing failure.
    reason: String
  },
  /// The required environment variable wasn't present.
  RequiredNotPresent,
}

impl Display for EnvError {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "EnvError::ParseError")
  }
}

impl Error for EnvError {
  fn source(&self) -> Option<&(dyn Error + 'static)> {
    None
  }
}

pub use boolean::get_env_bool_optional;
pub use boolean::get_env_bool_or_default;
pub use boolean::get_env_bool_required;

pub use duration::get_env_duration_seconds_optional;
pub use duration::get_env_duration_seconds_or_default;
pub use duration::get_env_duration_seconds_required;

pub use num::get_env_num;

pub use pathbuf::get_env_pathbuf_optional;
pub use pathbuf::get_env_pathbuf_or_default;
pub use pathbuf::get_env_pathbuf_required;

pub use string::get_env_string_optional;
pub use string::get_env_string_or_default;
pub use string::get_env_string_required;

/// Initialize Rust's env logger.
///
/// The Rust logger reads the desired log level from the `RUST_LOG` environment variable. If this
/// isn't set, the provided default is used. If a default fallback isn't provided to this function,
/// we fall back to `"info"`.
///
/// A more robust logging config might configure on a per-component basis, eg.
/// `"tokio_reactor=warn,hyper=info,debug"`. You can read more in the `log` and `env_logger` crate
/// docs.
pub fn init_env_logger(default_if_absent: Option<&str>) {
  if env::var(ENV_RUST_LOG)
    .as_ref()
    .ok()
    .is_none()
  {
    let default_log_level = default_if_absent.unwrap_or(DEFAULT_LOG_LEVEL);
    println!("Setting default logging level to \"{}\", override with env var {}.",
             default_log_level, ENV_RUST_LOG);
    env::set_var(ENV_RUST_LOG, default_log_level);
  }

  env_logger::init();
}

/// Initialize dotenv with the default `.env` config file.
pub fn init_dotenv() {
  match dotenv::dotenv() {
    Ok(_) => println!("dotenv configs initialized"),
    Err(e) => println!("Could not initialize dotenv: {:?}", e),
  }
}

/// Initialize dotenv and env logger.
/// See `init_dotenv()` and `init_env_logger(Option<&str>)` for further details.
pub fn init_all_with_default_logging(default_if_absent: Option<&str>) {
  init_dotenv();
  init_env_logger(default_if_absent)
}
