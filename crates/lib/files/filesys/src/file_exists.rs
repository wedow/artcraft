use std::path::Path;

pub fn file_exists<P: AsRef<Path>>(path: P) -> bool {
  let path_ref = path.as_ref();
  if !path_ref.exists() {
    return false;
  }
  if !path_ref.is_file() {
    return false;
  }
  true
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::file_exists::file_exists;

  #[test]
  fn test_file_exists() {
    assert!(file_exists("../../../../test_data/audio/flac/zelda_ocarina_small_item.flac"));
    assert!(file_exists(PathBuf::from("../../../../test_data/audio/flac/zelda_ocarina_small_item.flac")));
  }

  #[test]
  fn test_file_does_not_exist() {
    assert!(!file_exists(""));
    assert!(!file_exists("   "));
    assert!(!file_exists("./")); // Current directory is not a file
    assert!(!file_exists("foo"));
    assert!(!file_exists("foo/bar/baz"));
    assert!(!file_exists("/foo/bar/baz"));

    assert!(!file_exists(PathBuf::from("")));
    assert!(!file_exists(PathBuf::from("   ")));
    assert!(!file_exists(PathBuf::from("./")));
    assert!(!file_exists(PathBuf::from("foo/bar/baz")));
  }
}