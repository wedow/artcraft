use crate::events::sendable_event_trait::SendableEvent;
use crate::events::sora::sora_image_generation_complete_event::SoraImageGenerationCompleteEvent;
use crate::events::sora::sora_image_generation_failed_event::SoraImageGenerationFailedEvent;
use crate::state::data_dir::app_data_root::AppDataRoot;
use crate::state::data_dir::trait_data_subdir::DataSubdir;
use crate::state::fal::fal_credential_manager::FalCredentialManager;
use crate::state::fal::fal_task_queue::FalTaskQueue;
use crate::state::sora::sora_credential_manager::SoraCredentialManager;
use crate::state::storyteller::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use log::{error, info, warn};
use openai_sora_client::requests::image_gen::image_gen_status::{Generation, TaskId, TaskStatus};
use reqwest::Url;
use serde_derive::Serialize;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use storyteller_client::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Emitter};
use tempdir::TempDir;
use fal_client::fal_error_plus::FalErrorPlus;
use fal_client::utils::queue_status_checker::QueueStatusChecker;
use tokens::tokens::media_files::MediaFileToken;

pub async fn fal_task_polling_thread(
  app_handle: AppHandle,
  app_data_root: AppDataRoot,
  fal_creds_manager: FalCredentialManager,
  storyteller_creds_manager: StorytellerCredentialManager,
  fal_task_queue: FalTaskQueue,
) -> ! {
  loop {
    let res = polling_loop(
      &app_handle,
      &fal_creds_manager,
      &storyteller_creds_manager,
      &fal_task_queue,
      &app_data_root,
    ).await;
    if let Err(err) = res {
      error!("An error occurred: {:?}", err);
    }
    tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
  }
}

async fn polling_loop(
  app_handle: &AppHandle,
  fal_creds_manager: &FalCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_task_queue: &FalTaskQueue,
  app_data_root: &AppDataRoot,
) -> AnyhowResult<()> {
  loop {
    if fal_task_queue.is_empty()? {
      // No need to poll if we don't have pending tasks.
      tokio::time::sleep(std::time::Duration::from_millis(1_000)).await;
      continue;
    }

    info!("Task queue has {} pending tasks.", fal_task_queue.len()?);

    let key = fal_creds_manager.get_key_required()?;
    
    let queue_status_checker = QueueStatusChecker::new(key);

    // TODO: Clear completed tasks.
    // let mut succeeded_tasks = Vec::new();
    // let mut failed_tasks = Vec::new();
    
    let len = fal_task_queue.len()?;
    
    for i in 0..len {
      let task = match fal_task_queue.get_index(i)? {
        Some(task) => task,
        None => {
          warn!("Failed to get task ID at index {}", i);
          break;
        }
      };
      
      info!("Checking task status for task ID: {:?}", &task.enqueued_request.request_id);
      
      let result = queue_status_checker.check_status(&task.enqueued_request).await;
      
      match result {
        Err(err) => {
          warn!("Error checking job status: {:?}", err);
          tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
          continue;
        }
        Ok(status) => {
          info!("Status: {:?}", status);
        }
      }
    }


    
//    // TODO: The cursoring logic likely needs to improve.
//    for task in response.task_responses {
//      let status = TaskStatus::from_str(&task.status);
//
//      match status {
//        TaskStatus::Succeeded => {
//          succeeded_tasks.push(task);
//        }
//        TaskStatus::Failed => {
//          failed_tasks.push(task);
//        }
//        TaskStatus::Queued => {}
//        TaskStatus::Running => {}
//        TaskStatus::Unknown(_) => {}
//      }
//    }
//
//    for task in failed_tasks.iter() {
//      if fal_task_queue.contains_key(&task.id)? {
//        let event = SoraImageGenerationFailedEvent {
//          prompt: task.prompt.clone(),
//        };
//        event.send(&app_handle)?;
//      }
//    }
//
//    let failed_task_ids: Vec<&TaskId> = failed_tasks
//        .iter()
//        .map(|task| &task.id)
//        .collect();
//
//    fal_task_queue.remove_list(&failed_task_ids)?;
//
//    let creds = storyteller_creds_manager.get_credentials_required()?;
//    let api_host = ApiHost::Storyteller;
//
//    for task in succeeded_tasks.iter() {
//      if !fal_task_queue.contains_key(&task.id)? {
//        continue;
//      }
//      info!("Task succeeded: {:?}", task.id);
//
//      for (i, generation) in task.generations.iter().enumerate() {
//        info!("Downloading generated file...");
//        let download_path = download_generation(generation, &app_data_root).await?;
//
//        info!("Uploading to backend...");
//        let result = upload_image_media_file_from_file(&api_host, Some(&creds), download_path).await?;
//
//        info!("Uploaded to API backend: {:?}", result.media_file_token);
//
//        let event = SoraImageGenerationCompleteEvent {
//          media_file_token: result.media_file_token,
//        };
//
//        event.send(&app_handle)?;
//      }
//    }
//
//    let succeeded_task_ids : Vec<&TaskId> = succeeded_tasks
//        .iter()
//        .map(|task| &task.id)
//        .collect();
//
//    fal_task_queue.remove_list(&succeeded_task_ids)?;

    tokio::time::sleep(std::time::Duration::from_millis(6_000)).await;
  }
}

async fn download_generation(generation: &Generation, app_data_root: &AppDataRoot) -> AnyhowResult<PathBuf> {
  let url = Url::parse(&generation.url)?;

  let response = reqwest::get(&generation.url).await?;
  let image_bytes = response.bytes().await?;

  let ext = url.path().split(".").last().unwrap_or("png");

  let tempdir = app_data_root.temp_dir().path();
  let download_filename = format!("{}.{}", generation.id, ext);
  let download_path = tempdir.join(download_filename);

  let mut file = File::create(&download_path)?;
  file.write_all(&image_bytes)?;

  Ok(download_path)
}
