use crate::ml::downloads::download_all_models::download_all_models;
use crate::state::app_dir::AppDataRoot;
use tauri::State;

#[tauri::command]
pub async fn download_models(
  app_data_root: State<'_, AppDataRoot>,
) -> Result<String, String> {
  
  download_all_models(&app_data_root).await
    .map_err(|err| {
      "error downloading models".to_string()
    })?;
  
  Ok(("downloaded".to_string()))
}
