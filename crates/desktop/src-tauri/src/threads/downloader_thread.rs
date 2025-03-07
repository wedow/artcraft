use log::error;
use tauri::{AppHandle, Emitter};
use crate::events::notification_event::{NotificationEvent, NotificationModelType};
use crate::state::app_dir::AppDataRoot;

pub async fn downloader_thread(app_data_root: AppDataRoot, app: AppHandle) -> ! {
  loop {
    //let result = app.emit("notification", NotificationEvent::ModelDownloadStarted { 
    //  model_name: "model", 
    //  model_type: NotificationModelType::Unet 
    //});
    //if let Err(err) = result {
    //  error!("Could not emit event: {}", err);
    //}
    
    std::thread::sleep(std::time::Duration::from_millis(500));
  }
}
