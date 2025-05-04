use crate::state::data_dir::trait_data_subdir::DataSubdir;
use std::path::{Path, PathBuf};

/// For now, let's just keep a collection of loose json files in a settings dir.
/// Once we know the structure and schema, we can standardize on a single json file.
#[derive(Clone)]
pub struct AppSettingsDir {
  path: PathBuf,
}

impl DataSubdir for AppSettingsDir {
  const DIRECTORY_NAME: &'static str = "settings";

  fn new_from<P: AsRef<Path>> (dir: P) -> Self {
    Self {
      path: dir.as_ref().to_path_buf(),
    }
  }

  fn path(&self) -> &Path {
    &self.path
  }
}

impl AppSettingsDir {
  pub fn get_download_preferences_file_path(&self) -> PathBuf {
    self.path.join("download_settings.json")
  }

  pub fn get_app_preferences_path(&self) -> PathBuf {
    self.path.join("app_preferences.json")
  }
}
