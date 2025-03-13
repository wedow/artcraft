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

const NOTIFICATION_CHANNEL_NAME : &str = "notification";
const MAX_FILES : usize = 8;
const CHUNK_SIZE : usize = 1024 * 1024;
const PARALLEL_FAILURES : usize = 8;
const MAX_RETRIES : usize = 30;

struct ModelDownloadStatusChannel {
  pub model_name: String,
  pub model_type: NotificationModelType,
  pub final_file_path: PathBuf,
  pub receiver: Receiver<ProgressUpdate>,
}

pub async fn downloader_thread(app_data_root: AppDataRoot, app: AppHandle) -> ! {

  let mut status_check_queue : Arc<Mutex<Vec<ModelDownloadStatusChannel>>> = Arc::new(Mutex::new(Vec::new()));

  {
    let status_check_queue2 = status_check_queue.clone();
    let app2 = app.clone();

    tokio::spawn(download_notify_thread(status_check_queue2, app2));
  }

  let mut download_queue = VecDeque::new();

  // TODO: Automatic enqueue of known important models + enqueue new models on-demand
  download_queue.push_back(ModelType::ClipJson);
  //download_queue.push_back(ModelType::SdxlTurboUnet);
  //download_queue.push_back(ModelType::SdxlTurboVae);
  download_queue.push_back(ModelType::SdxlTurboClipEncoder); // TODO(bt): Why is this still needed?
  //download_queue.push_back(ModelType::SdxlTurboClipEncoder2);
  download_queue.push_back(ModelType::SimianLuoLcmDreamshaperV7Unet);
  download_queue.push_back(ModelType::LykonDreamshaper7Vae);
  download_queue.push_back(ModelType::LykonDreamshaper7TextEncoderFp16);

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

    let result = app.emit(NOTIFICATION_CHANNEL_NAME, NotificationEvent::ModelDownloadStarted {
      model_name: model.get_name(),
      model_type: model.get_notification_type(),
    });

    if let Err(err) = result {
      error!("Could not emit event: {}", err);
    }

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
        lock.push(ModelDownloadStatusChannel {
          receiver: rx,
          final_file_path: filename.clone(),
          model_name: model.get_name().to_string(),
          model_type: model.get_notification_type(),
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

pub async fn download_notify_thread(queue: Arc<Mutex<Vec<ModelDownloadStatusChannel>>>, app: AppHandle) -> ! {
  loop {
    match queue.lock() {
      Err(err) => error!("Could not unlock: {:?}", err),
      Ok(mut lock) => {
        debug!(">>>>> Notifier has {} items", lock.len());

        let mut reenqueue = Vec::with_capacity(lock.len());

        for item in (*lock).drain(..) {
          if let Ok(update) = item.receiver.try_recv() {
            let result = app.emit(NOTIFICATION_CHANNEL_NAME, NotificationEvent::ModelDownloadProgress {
              model_name: &item.model_name,
              model_type: item.model_type,
              currently_downloaded_bytes: update.complete,
              total_file_bytes: update.total_length,
            });

            if let Err(err) = result {
              error!("Could not emit event: {}", err);
            }
          }

          if item.final_file_path.exists() {
            debug!("No longer sending notifications for {:?}", &item.final_file_path);

            let result = app.emit(NOTIFICATION_CHANNEL_NAME, NotificationEvent::ModelDownloadComplete {
              model_name: &item.model_name,
              model_type: item.model_type,
            });

            if let Err(err) = result {
              error!("Could not emit event: {}", err);
            }
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
