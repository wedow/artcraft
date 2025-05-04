use std::path::PathBuf;
use serde_derive::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PreferredDownloadDirectory {
  SystemDefault,
  Custom(PathBuf),
}
