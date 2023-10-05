use std::path::Path;

/// Check if the path exists and if it's a directory.
#[inline]
pub fn directory_exists<P: AsRef<Path>>(path: P) -> bool {
  let path_ref = path.as_ref();
  if !path_ref.exists() {
    return false;
  }
  if !path_ref.is_dir() {
    return false;
  }
  true
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::directory_exists::directory_exists;

  #[test]
  fn test_directory_exists() {
    // Common directories
    assert!(directory_exists("../../../../.."));
    assert!(directory_exists("./"));
    assert!(directory_exists("../"));
    assert!(directory_exists("/"));

    // As PathBuf
    assert!(directory_exists(PathBuf::from("../../../../..")));
    assert!(directory_exists(PathBuf::from("./")));
    assert!(directory_exists(PathBuf::from("../")));
    assert!(directory_exists(PathBuf::from("/")));

    // Other directories
    assert!(directory_exists("../../../../test_data/audio/flac"));
    assert!(directory_exists(PathBuf::from("../../../../test_data/audio/flac")));
  }

  #[test]
  fn test_file_does_not_exist() {
    assert!(!directory_exists(""));
    assert!(!directory_exists("   "));
    assert!(!directory_exists("foo"));
    assert!(!directory_exists("foo/bar/baz"));
    assert!(!directory_exists("/foo/bar/baz"));

    assert!(!directory_exists(PathBuf::from("")));
    assert!(!directory_exists(PathBuf::from("   ")));
    assert!(!directory_exists(PathBuf::from("foo/bar/baz")));
  }
}
