use crate::core::events::sendable_event_trait::SendableEvent;
use crate::services::sora::events::sora_image_generation_complete_event::SoraImageGenerationCompleteEvent;
use crate::services::sora::events::sora_image_generation_failed_event::SoraImageGenerationFailedEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use log::{error, info};
use openai_sora_client::recipes::list_sora_task_status_with_session_auto_renew::{list_sora_task_status_with_session_auto_renew, StatusRequestArgs};
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
use tokens::tokens::media_files::MediaFileToken;

pub async fn sora_task_polling_thread(
  app_handle: AppHandle,
  app_data_root: AppDataRoot,
  sora_creds_manager: SoraCredentialManager,
  storyteller_creds_manager: StorytellerCredentialManager,
  sora_task_queue: SoraTaskQueue,
) -> ! {
  loop {
    let res = polling_loop(
      &app_handle,
      &sora_creds_manager, 
      &storyteller_creds_manager, 
      &sora_task_queue,
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
  sora_creds_manager: &SoraCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  sora_task_queue: &SoraTaskQueue,
  app_data_root: &AppDataRoot,
) -> AnyhowResult<()> {
  loop {
    if sora_task_queue.is_empty()? {
      // No need to poll if we don't have pending tasks.
      tokio::time::sleep(std::time::Duration::from_millis(1_000)).await;
      continue;
    }

    info!("Task queue has {} pending tasks.", sora_task_queue.len()?);

    let creds = sora_creds_manager.get_credentials_required()?;

    let (response, maybe_new_creds) = list_sora_task_status_with_session_auto_renew(StatusRequestArgs {
      limit: None,
      // TODO: How can we use the task id to poll better? Our existing code doesn't seem to illuminate this.
      before: None,
      credentials: creds,
    }).await?;

    if let Some(new_creds) = maybe_new_creds {
      info!("Saving new credentials.");
      sora_creds_manager.set_credentials(&new_creds)?;
    }

    let mut succeeded_tasks = Vec::new();
    let mut failed_tasks = Vec::new();

    // TODO: The cursoring logic likely needs to improve.
    for task in response.task_responses {
      let status = TaskStatus::from_str(&task.status);

      match status {
        TaskStatus::Succeeded => {
          succeeded_tasks.push(task);
        }
        TaskStatus::Failed => {
          failed_tasks.push(task);
        }
        TaskStatus::Queued => {}
        TaskStatus::Running => {}
        TaskStatus::Unknown(_) => {}
      }
    }
    
    for task in failed_tasks.iter() {
      if sora_task_queue.contains_key(&task.id)? {
        let event = SoraImageGenerationFailedEvent { 
          prompt: task.prompt.clone(),
        };
        event.send(&app_handle)?;
      }
    }

    let failed_task_ids: Vec<&TaskId> = failed_tasks
        .iter()
        .map(|task| &task.id)
        .collect();

    sora_task_queue.remove_list(&failed_task_ids)?;
    
    let creds = storyteller_creds_manager.get_credentials_required()?;
    let api_host = ApiHost::Storyteller;

    for task in succeeded_tasks.iter() {
      if !sora_task_queue.contains_key(&task.id)? {
        continue;
      }
      info!("Task succeeded: {:?}", task.id);
    
      for (i, generation) in task.generations.iter().enumerate() {
        info!("Downloading generated file...");
        let download_path = download_generation(generation, &app_data_root).await?;

        info!("Uploading to backend...");
        let result = upload_image_media_file_from_file(&api_host, Some(&creds), download_path).await?;
        
        info!("Uploaded to API backend: {:?}", result.media_file_token);
        
        let event = SoraImageGenerationCompleteEvent {
          media_file_token: result.media_file_token,
        };
        
        event.send(&app_handle)?;
      }
    }

    let succeeded_task_ids : Vec<&TaskId> = succeeded_tasks
        .iter()
        .map(|task| &task.id)
        .collect();

    sora_task_queue.remove_list(&succeeded_task_ids)?;

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
