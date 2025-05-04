use errors::AnyhowError;
use serde_derive::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};
use std::path::PathBuf;
use std::str::FromStr;

const SYSTEM_DEFAULT_SENTINEL_VALUE: &str = "system_default";

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PreferredDownloadDirectory {
  /// The system-default downloads directory, which varies by OS.
  /// NB: Serializes as `"system_default"` in JSON.
  SystemDefault,
  
  /// A user-defined path
  /// NB: Serializes as `{"custom": "/path/to/dir"}` in JSON.
  Custom(PathBuf),
}

impl FromStr for PreferredDownloadDirectory {
  type Err = AnyhowError;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    if s == SYSTEM_DEFAULT_SENTINEL_VALUE || s == "\"system_default\"" {
      Ok(PreferredDownloadDirectory::SystemDefault)
    } else {
      // TODO: If it gets serialized as JSON, we may need to remove the `{"custom": ...` wrapping layer.
      let path = PathBuf::from(s);
      Ok(PreferredDownloadDirectory::Custom(path))
    }
  }
}

impl Display for PreferredDownloadDirectory {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      PreferredDownloadDirectory::SystemDefault => write!(f, "{}", SYSTEM_DEFAULT_SENTINEL_VALUE),
      PreferredDownloadDirectory::Custom(path) => write!(f, "{}", path.to_string_lossy()),
    }
  }
}


#[cfg(test)]
mod tests {
  use crate::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
  use std::path::PathBuf;
  use std::str::FromStr;

  mod json {
    use super::*;

    #[test]
    fn to_json_system_default() {
      let val = PreferredDownloadDirectory::SystemDefault;
      let val = serde_json::to_string(&val).unwrap();
      assert_eq!(&val, "\"system_default\"");
    }
    
    #[test]
    fn to_json_custom() {
      let val = PreferredDownloadDirectory::Custom("/tmp".into());
      let val = serde_json::to_string(&val).unwrap();
      assert_eq!(&val, "{\"custom\":\"/tmp\"}");
    }
  }

  mod string {
    use super::*;

    #[test]
    fn to_string_system_default() {
      let val = PreferredDownloadDirectory::SystemDefault;
      let val = val.to_string();
      assert_eq!(&val, "system_default");
    }

    #[test]
    fn to_string_custom() {
      let val = PreferredDownloadDirectory::Custom("/tmp/foo".into());
      let val = val.to_string();
      assert_eq!(&val, "/tmp/foo");
    }
  }

  #[test]
  fn from_string_system_default() {
    let val = "system_default";
    let val = PreferredDownloadDirectory::from_str(val).unwrap();
    assert_eq!(val, PreferredDownloadDirectory::SystemDefault);
  }

  #[test]
  fn from_string_custom() {
    let val = "/tmp/foo";
    let val = PreferredDownloadDirectory::from_str(val).unwrap();
    assert_eq!(val, PreferredDownloadDirectory::Custom(PathBuf::from("/tmp/foo")));
  }
}
