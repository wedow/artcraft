use errors::AnyhowError;
use serde_derive::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};
use std::path::PathBuf;
use std::str::FromStr;

const SYSTEM_DEFAULT_SENTINEL_VALUE: &str = "system_default";

/// NB: The reason these are not flat is so that they serialize/deserialize nicely to/from JSON.
#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PreferredDownloadDirectory {
  /// The system-default downloads directory, which varies by OS.
  /// NB: Serializes as `"system_default"` in JSON.
  System(SystemDownloadDirectory),
  
  /// A user-defined path
  /// NB: Serializes as `{"custom": "/path/to/dir"}` in JSON.
  Custom(PathBuf),
}

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SystemDownloadDirectory {
  Downloads,
  Documents,
}

impl FromStr for SystemDownloadDirectory {
  type Err = AnyhowError;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    match (s) {
      "downloads" => Ok(SystemDownloadDirectory::Downloads),
      "documents" => Ok(SystemDownloadDirectory::Documents),
      _ => Err(AnyhowError::msg(format!("Invalid system download directory: {}", s))),
    }
  }
}

impl Display for PreferredDownloadDirectory {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      PreferredDownloadDirectory::System(system) => system.fmt(f),
      PreferredDownloadDirectory::Custom(path) => write!(f, "{}", path.to_string_lossy()),
    }
  }
}

impl Display for SystemDownloadDirectory {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      SystemDownloadDirectory::Downloads => write!(f, "downloads"),
      SystemDownloadDirectory::Documents => write!(f, "documents"),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
  use crate::state::app_preferences::preferred_download_directory::SystemDownloadDirectory;
  use std::str::FromStr;

  mod json {
    use super::*;

    #[test]
    fn to_json_system_default() {
      let val = PreferredDownloadDirectory::System(SystemDownloadDirectory::Documents);
      let val = serde_json::to_string(&val).unwrap();
      assert_eq!(&val, "{\"system\":\"documents\"}");
    }
    
    #[test]
    fn to_json_custom() {
      let val = PreferredDownloadDirectory::Custom("/tmp".into());
      let val = serde_json::to_string(&val).unwrap();
      assert_eq!(&val, "{\"custom\":\"/tmp\"}");
    }
  }
}
