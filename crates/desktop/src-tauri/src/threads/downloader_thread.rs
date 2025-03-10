use crate::ml::model_type::ModelType;
use crate::state::app_dir::AppDataRoot;
use crate::transfer::download::{download_async, ProgressUpdate};
use tauri::{AppHandle, Emitter};
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use std::sync::mpsc::Receiver;
use futures::stream::FuturesUnordered;
use futures::StreamExt;
use log::{error, info};
use tokio::task::JoinHandle;
use crate::events::notification_event::{NotificationEvent, NotificationModelType};

const MAX_FILES : usize = 8;
const CHUNK_SIZE : usize = 1024 * 1024;
const PARALLEL_FAILURES : usize = 8;
const MAX_RETRIES : usize = 30;

struct TaskAndStatus {
  pub receiver: Receiver<ProgressUpdate>,
}

pub async fn downloader_thread(app_data_root: AppDataRoot, app: AppHandle) -> ! {

  let mut status_check_queue : Arc<Mutex<Vec<TaskAndStatus>>> = Arc::new(Mutex::new(Vec::new()));
  let mut status_check_queue2 = status_check_queue.clone();

  tokio::spawn(async move {
    loop {

      match status_check_queue2.lock() {
        Err(err) => error!("Could not unlock: {:?}", err),
        Ok(lock) => {
          
          for item in &*lock {
            if let Ok(item) = item.receiver.try_recv() {
              let result = app.emit("notification", NotificationEvent::ModelDownloadStarted { 
                model_name: "model", 
                model_type: NotificationModelType::Unet 
              });
              
              if let Err(err) = result {
                error!("Could not emit event: {}", err);
              }
            }
          }
        }
      }

      std::thread::sleep(std::time::Duration::from_millis(500));
    }
  });




  let mut download_queue = VecDeque::new();
  
  // TODO: Automatic enqueue
  download_queue.push_back(ModelType::ClipJson);
  download_queue.push_back(ModelType::SdxlTurboUnet);
  download_queue.push_back(ModelType::SdxlTurboVae);
  download_queue.push_back(ModelType::SdxlTurboClipEncoder);
  download_queue.push_back(ModelType::SdxlTurboClipEncoder2);

  let mut handles = FuturesUnordered::new();

  while let Some(model) = download_queue.pop_front() {
    let url = model.get_download_url().to_string();

    let filename = app_data_root.weights_dir().model_path(&model);

    if filename.exists() {
      continue;
    }

    let headers = None;
    
    let (tx, rx) = std::sync::mpsc::channel();

    info!("Download: {:?}", filename);

    let task = tokio::spawn(download_async(url, filename, MAX_FILES, CHUNK_SIZE,
                                PARALLEL_FAILURES, MAX_RETRIES, headers, Some(tx)));

    match status_check_queue.lock() {
      Err(err) => error!("Could not unlock: {:?}", err),
      Ok(mut lock) => {
        lock.push(TaskAndStatus {
          receiver: rx,
        })
      }
    }

    handles.push(task);
  }

  while let Some(result) = handles.next().await {
    match result {
      Err(err) => error!("Error downloading: {:?}", err),
      Ok(_) => {},
    }
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

