use crate::events::notification_event::{NotificationEvent, NotificationModelType};
use crate::ml::model_type::ModelType;
use crate::state::app_dir::AppDataRoot;
use crate::transfer::download::{download_async, ProgressUpdate};
use futures::stream::FuturesUnordered;
use futures::StreamExt;
use log::{debug, error, info};
use std::collections::VecDeque;
use std::path::PathBuf;
use std::sync::mpsc::Receiver;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tempfile::NamedTempFile;
use tokio::task::JoinHandle;

const MAX_FILES : usize = 8;
const CHUNK_SIZE : usize = 1024 * 1024;
const PARALLEL_FAILURES : usize = 8;
const MAX_RETRIES : usize = 30;

struct TaskAndStatus {
  pub filename: PathBuf,
  pub receiver: Receiver<ProgressUpdate>,
}

pub async fn downloader_thread(app_data_root: AppDataRoot, app: AppHandle) -> ! {

  let mut status_check_queue : Arc<Mutex<Vec<TaskAndStatus>>> = Arc::new(Mutex::new(Vec::new()));
  let status_check_queue2 = status_check_queue.clone();

  tokio::spawn(download_notify_thread(status_check_queue2, app));

  let mut download_queue = VecDeque::new();
  
  // TODO: Automatic enqueue of known important models + enqueue new models on-demand
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
      info!("File already exists: {:?}", &filename);
      continue;
    }

    let headers = None;
    
    let (tx, rx) = std::sync::mpsc::channel();

    info!("Download: {:?}", filename);

    let temp_file = match app_data_root.temp_dir().new_named_temp_file() {
      Ok(file) => file,
      Err(err) => {
        error!("Couldn't create a temporary file: {:?}", err);
        continue;
      }
    };

    let task = tokio::spawn(download_async(
      url,
      temp_file,
      filename.clone(),
      MAX_FILES,
      CHUNK_SIZE,
      PARALLEL_FAILURES,
      MAX_RETRIES,
      headers,
      Some(tx),
    ));

    match status_check_queue.lock() {
      Err(err) => error!("Could not unlock: {:?}", err),
      Ok(mut lock) => {
        lock.push(TaskAndStatus {
          filename: filename.clone(),
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

  loop {
    // TODO(bt,2025-03-10): Queue management for new files entering the queue.
    tokio::time::sleep(std::time::Duration::from_millis(60_000)).await;
  }
}

pub async fn download_notify_thread(queue: Arc<Mutex<Vec<TaskAndStatus>>>, app: AppHandle) -> ! {
  loop {
    match queue.lock() {
      Err(err) => error!("Could not unlock: {:?}", err),
      Ok(mut lock) => {

        debug!(">>>>> Notifier has {} items", lock.len());

        let mut reenqueue = Vec::with_capacity(lock.len());

        for item in (*lock).drain(..) {
          if let Ok(item) = item.receiver.try_recv() {
            let result = app.emit("notification", NotificationEvent::ModelDownloadProgress {
              model_name: "model",
              model_type: NotificationModelType::Unet,
              currently_downloaded_bytes: item.complete,
              total_file_bytes: item.total_length,
            });

            if let Err(err) = result {
              error!("Could not emit event: {}", err);
            }
          }

          if item.filename.exists() {
            debug!("No longer sending notifications for {:?}", &item.filename);
          } else {
            reenqueue.push(item);
          }
        }

        lock.extend(reenqueue);
      }
    }

    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
  }
}

