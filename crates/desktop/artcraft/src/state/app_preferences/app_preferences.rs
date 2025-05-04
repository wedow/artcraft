use crate::state::app_preferences::app_preferences_serializable::AppPreferencesSerializable;
use crate::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use crate::state::data_dir::app_data_root::AppDataRoot;

#[derive(Clone)]
pub struct AppPreferences {
  /// The downloads directory to use when a user downloads a file.
  pub preferred_download_directory: PreferredDownloadDirectory,

  /// Play sounds on events.
  pub play_sounds: bool,
}

impl Default for AppPreferences {
  fn default() -> Self {
    Self {
      preferred_download_directory: PreferredDownloadDirectory::SystemDefault,
      play_sounds: true,
    }
  }
}

impl AppPreferences {
  pub fn load_from_file_or_default(data_root: &AppDataRoot) -> Self {
    let filename = data_root.settings_dir().get_app_preferences_path();
    if !filename.exists() {
      return Self::default();
    }

    match AppPreferencesSerializable::load_from_file(data_root) {
      Ok(Some(serializable)) => {
        serializable.to_preferences()
      }
      Ok(None) => {
        Self::default()
      }
      Err(err) => {
        println!("Error loading app preferences: {}", err);
        Self::default()
      }
    }
  }
  
  pub fn to_serializable(&self) -> AppPreferencesSerializable {
    AppPreferencesSerializable {
      preferred_download_directory: Some(self.preferred_download_directory.clone()),
      play_sounds: Some(self.play_sounds),
    }
  }
}
