use crate::ml::model_type::ModelType;
use crate::state::app_dir::AppDataRoot;
use crate::transfer::download::download_async;
use tauri::AppHandle;
use std::collections::VecDeque;

const MAX_FILES : usize = 8;
const CHUNK_SIZE : usize = 1024 * 1024;
const PARALLEL_FAILURES : usize = 8;
const MAX_RETRIES : usize = 30;

pub async fn downloader_thread(app_data_root: AppDataRoot, app: AppHandle) -> ! {
  
  let mut download_queue = VecDeque::new();
  
  // TODO: Automatic enqueue
  download_queue.push_back(ModelType::ClipJson);
  download_queue.push_back(ModelType::SdxlTurboUnet);
  download_queue.push_back(ModelType::SdxlTurboVae);
  download_queue.push_back(ModelType::SdxlTurboClipEncoder);
  download_queue.push_back(ModelType::SdxlTurboClipEncoder2);
  
  while let Some(model) = download_queue.pop_front() {
    let url = model.get_download_url().to_string();

    let filename = "temp.obj".to_string();

    let filename = app_data_root.weights_dir().path().join(filename);

    let headers = None;
    
    let (tx, rx) = std::sync::mpsc::channel();

    let task = tokio::spawn(download_async(url, filename, MAX_FILES, CHUNK_SIZE,
                                PARALLEL_FAILURES, MAX_RETRIES, headers, Some(tx)));
    
  }

  
  //match result {
  //  Ok(_) => {
  //    println!("Downloaded successfully!");
  //  }
  //  Err(error) => {
  //    println!("Downloaded failed! {:?}", error);
  //  }
  //}

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
