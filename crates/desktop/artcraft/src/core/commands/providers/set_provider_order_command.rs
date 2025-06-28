use crate::core::commands::response::shorthand::{ResponseOrErrorMessage, SuccessOrErrorMessage};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::core::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};

#[derive(Deserialize)]
pub struct SetProviderOrderRequest {
  pub providers: Vec<Provider>,
}

#[tauri::command]
pub async fn set_provider_order_command(
  request: SetProviderOrderRequest,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  app_data_root: State<'_, AppDataRoot>,
) -> SuccessOrErrorMessage {
  info!("set_provider_order_command called");

  provider_priority_store.set_priority(&request.providers)
      .map_err(|err| {
        error!("Failed to set provider order: {:?}", err);
        "Failed to set provider order"
      })?;
  
  provider_priority_store.persist_to_filesystem(&app_data_root)
      .map_err(|err| {
        error!("Failed to persist provider order to filesystem: {:?}", err);
        "Failed to persist provider order"
      })?;

  Ok(().into())
}
