use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::GenerationServiceProvider;
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::download_url_to_temp_dir::download_url_to_temp_dir;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use fal_client::export::queue::Status;
use fal_client::model::fal_request_id::FalRequestId;
use fal_client::utils::queue_status_checker::QueueStatusChecker;
use log::{error, info, warn};
use storyteller_client::recipes::upload_media_file_from_file::upload_media_file_from_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::AppHandle;
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
    let storyteller_creds = storyteller_creds_manager.get_credentials_required()?;

    let queue_status_checker = QueueStatusChecker::new(key);

    let mut succeeded_tasks = Vec::new();
    //let mut failed_tasks = Vec::new(); // TODO

    let len = fal_task_queue.len()?;

    for i in 0..len {
      let task = match fal_task_queue.get_index(i)? {
        Some(task) => task,
        None => {
          warn!("Failed to get task ID at index {}", i);
          break;
        }
      };
      
      let task_id = task.enqueued_request.request_id.clone();

      info!("Checking task status for task ID: {:?}", &task_id);

      let result = queue_status_checker.check_status(&task.enqueued_request).await;

      let url = match result {
        Err(err) => {
          warn!("Error checking job status: {:?}", err);
          tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
          
          // TODO: Some failures will be permanent job failures and the jobs will need to be removed.
          
          continue;
        }
        Ok(status) => {
          info!("Status: {:?}", status);
          match status.status {
            Status::Completed => {
              let result = queue_status_checker.get_download_url(&task.enqueued_request).await;
              
              let url = match result {
                Ok(url) => url,
                Err(err) => {
                  warn!("Failed to get download url: {:?}", err);
                  
                  // TODO: Some failures will be permanent job failures.
                  
                  continue; 
                }
              };
              
              url
            }
            _ => {
              continue;
            },
          }
        }
      };

      // TODO: Clean up
      
      let download_file = download_url_to_temp_dir(&url, &app_data_root).await?;
      
      let result = upload_media_file_from_file(
        &ApiHost::Storyteller,
        Some(&storyteller_creds),
        download_file
      ).await;

      match result {
        Ok(success) => {
          info!("Uploaded to API backend: {:?}", success.media_file_token);

          let event = GenerationCompleteEvent {
            //media_file_token: result.media_file_token,
            action: task.generation_type
                .map(|typ| typ.to_event_generation_action()),
            service: GenerationServiceProvider::Fal,
            model: None,
          };

          if let Err(err) = event.send(&app_handle) {
            error!("Failed to send GenerationCompleteEvent: {:?}", err); // Fail open
          }

          succeeded_tasks.push(task_id);
        }
        Err(err) => {
          warn!("Failed to upload media file: {:?}", err);
          continue;
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
    let succeeded_task_ids : Vec<&FalRequestId> = succeeded_tasks
        .iter()
        .map(|task| task)
        .collect::<Vec<_>>();

    fal_task_queue.remove_list(&succeeded_task_ids)?;

    tokio::time::sleep(std::time::Duration::from_millis(1_000)).await;
  }
}

