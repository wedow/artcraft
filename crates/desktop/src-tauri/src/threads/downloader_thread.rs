use tauri::{AppHandle, Emitter};
use crate::state::app_dir::AppDataRoot;

pub async fn downloader_thread(app_data_root: AppDataRoot, app: AppHandle) -> ! {
  loop {
    app.emit("testing", 1);
    
    println!(">>> Testing: {:?}", app_data_root.path());
    std::thread::sleep(std::time::Duration::from_millis(500));
  }
}
