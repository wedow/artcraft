use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use std::path::{Path, PathBuf};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone)]
pub struct AppDownloadsDir {
  path: PathBuf,
}

impl DataSubdir for AppDownloadsDir {
  const DIRECTORY_NAME: &'static str = "downloads";

  fn new_from<P: AsRef<Path>>(dir: P) -> Self {
    Self {
      path: dir.as_ref().to_path_buf(),
    }
  }

  fn path(&self) -> &Path {
    &self.path
  }
}

impl AppDownloadsDir {
  pub fn media_file_json_path(&self, media_token: &MediaFileToken) -> PathBuf {
    let filename = format!("{}.json", media_token.as_str());
    self.path().join(&filename)
  }
}
