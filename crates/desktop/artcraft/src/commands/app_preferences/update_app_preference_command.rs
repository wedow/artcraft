use crate::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use crate::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};

/// For now, we'll only update a single preference at a time.
#[derive(Deserialize)]
pub struct UpdateAppPreferencesRequest {
  pub preference: PreferenceName,
  /// We'll decode this with respect to the preference value.
  pub value: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PreferenceName {
  PreferredDownloadDirectory,
  PlaySounds,
}

#[derive(Serialize)]
pub struct UpdateAppPreferencesResponse {
  pub success: bool,
}


#[tauri::command]
pub async fn update_app_preferences_command(
  request: UpdateAppPreferencesRequest,
  app_prefs: State<'_, AppPreferencesManager>,
  app_data_root: State<'_, AppDataRoot>,
) -> Result<UpdateAppPreferencesResponse, String> {
  info!("update_app_preferences_command called");

  update_prefs(request, &app_prefs, &app_data_root)
      .await
      .map_err(|err| {
        error!("Error getting app preferences: {:?}", err);
        format!("Error getting app preferences: {:?}", err)
      })?;

  Ok(UpdateAppPreferencesResponse {
    success: true,
  })
}

async fn update_prefs(
  request: UpdateAppPreferencesRequest, 
  app_prefs: &AppPreferencesManager,
  app_data_root: &AppDataRoot,
) -> AnyhowResult<()> {
  let mut prefs = app_prefs.get_clone()?;
  
  match request.preference {
    PreferenceName::PreferredDownloadDirectory => {
      prefs.preferred_download_directory = request.value.parse::<PreferredDownloadDirectory>()?;
    }
    PreferenceName::PlaySounds => {
      prefs.play_sounds = request.value.parse::<bool>()?;
    }
  }
  
  app_prefs.set_clone(&prefs)?;
  app_data_root.settings_dir().write_app_preferences(&prefs)?;
  
  Ok(())
}
