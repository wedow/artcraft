use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::tauri::tasks::task_status;
use errors::AnyhowResult;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use once_cell::sync::Lazy;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::list_sora_task_status_with_session_auto_renew::{list_sora_task_status_with_session_auto_renew, StatusRequestArgs};
use openai_sora_client::requests::common::task_id::TaskId;
use openai_sora_client::requests::job_status::sora_job_status::{Generation, TaskStatus};
use reqwest::Url;
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs, Task, TaskList};
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use storyteller_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use storyteller_client::endpoints::prompts::create_prompt::create_prompt;
use tauri::AppHandle;
use tempdir::TempDir;

pub async fn sora_task_polling_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  app_data_root: AppDataRoot,
  task_database: TaskDatabase,
  sora_creds_manager: SoraCredentialManager,
  storyteller_creds_manager: StorytellerCredentialManager,
  sora_task_queue: SoraTaskQueue,
) -> ! {
  loop {
    let res = polling_loop(
      &app_handle,
      &app_env_configs,
      &task_database,
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
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
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

    let local_tasks = list_tasks_by_provider_and_status(ListTasksByProviderAndStatusArgs {
      db: task_database.get_connection(),
      provider: GenerationProvider::Sora,
      task_statuses: &TASK_DATABASE_PENDING_STATUSES,
    }).await?;

    poll_sora_tasks(
      &app_handle,
      &app_env_configs,
      &task_database,
      &sora_creds_manager,
      &creds,
      &storyteller_creds_manager,
      &sora_task_queue,
      &app_data_root,
      local_tasks,
    ).await?;

    tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
  }

async fn poll_sora_tasks(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  sora_creds_manager: &SoraCredentialManager,
  sora_creds: &SoraCredentialSet,
  storyteller_creds_manager: &StorytellerCredentialManager,
  sora_task_queue: &SoraTaskQueue,
  app_data_root: &AppDataRoot,
  local_tasks: TaskList,
) -> AnyhowResult<()> {

  let local_tasks = local_tasks.tasks;

  if local_tasks.is_empty() {
    return Ok(())
  }

  // Map of Sora Task ID to Local Task.
  let local_tasks_by_sora_task_id = local_tasks.iter()
      .filter_map(|task| {
        if let Some(provider_job_id) = &task.provider_job_id {
          Some((provider_job_id.clone(), task.clone()))
        } else {
          None
        }
      })
      .collect::<HashMap<String, Task>>();

  let (sora_response, maybe_new_creds) = list_sora_task_status_with_session_auto_renew(StatusRequestArgs {
    limit: None,
    // TODO: How can we use the task id to poll better? Our existing code doesn't seem to illuminate this.
    before: None,
    credentials: sora_creds,
  }).await?;

  if let Some(new_creds) = maybe_new_creds {
    info!("Saving new credentials.");
    sora_creds_manager.set_credentials(&new_creds)?;
  }

  let sora_items = sora_response.task_responses;

  let mut succeeded_tasks_by_id= HashMap::new();
  let mut failed_tasks_by_id = HashMap::new();

  let storyteller_creds = storyteller_creds_manager.get_credentials_required()?;

  for task in sora_items.iter() {
    let status = TaskStatus::from_str(&task.status);

    match status {
      TaskStatus::Succeeded => {
        succeeded_tasks_by_id.insert(task.id.clone(), task.clone());
      }
      TaskStatus::Failed => {
        failed_tasks_by_id.insert(task.id.clone(), task.clone());
      }
      TaskStatus::Queued => {}
      TaskStatus::Running => {}
      TaskStatus::Unknown(_) => {}
    }
  }

  // Clear dead tasks.

  for (task_id, task) in failed_tasks_by_id.iter() {
    // Emit events for failed tasks.
    if sora_task_queue.contains_key(task_id)? {
      let event = GenerationFailedEvent {
        action: GenerationAction::GenerateImage,
        service: GenerationServiceProvider::Sora,
        model: None,
        reason: None,
      };

      event.send_infallible(&app_handle);
    }

    // Clear from SQLite task database.
    if let Some(local_task) = local_tasks_by_sora_task_id.get(task_id.as_str()) {
      info!("Marking local task as failed: {:?}", local_task.id);

      let _updated = update_task_status(UpdateTaskArgs {
        db: task_database.get_connection(),
        task_id: &local_task.id,
        status: task_status::TaskStatus::CompleteFailure,
      }).await?;
    }
  }

  // Clear from in memory DB
  // TODO: Remove the in-memory queue in favor of SQLite only.
  let failed_task_ids: Vec<&TaskId> = failed_tasks_by_id.keys().collect();
  sora_task_queue.remove_list(&failed_task_ids)?;


  // Process succeeded tasks.

  for (task_id, task) in succeeded_tasks_by_id.iter() {
    if !sora_task_queue.contains_key(task_id)? {
      // TODO: Remove once the in-memory queue is gone.
      continue;
    }

    info!("Task succeeded: {:?}", task.id);

    let request = CreatePromptRequest {
      uuid_idempotency_token: generate_random_uuid(),
      positive_prompt: task.prompt.clone(),
      negative_prompt: None,
      model_type: Some(ModelType::GptImage1),
      generation_provider: Some(GenerationProvider::Sora),
    };

    let prompt_response = create_prompt(
      &app_env_configs.storyteller_host,
      Some(&storyteller_creds),
      request
    ).await?;

    info!("Created prompt: {:?}", &prompt_response.prompt_token);

    for (i, generation) in task.generations.iter().enumerate() {
      info!("Downloading generated file...");
      let download_path = download_generation(generation, &app_data_root).await?;

      info!("Uploading to backend...");

      let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(&storyteller_creds),
        path: download_path,
        is_intermediate_system_file: false,
        maybe_prompt_token: Some(&prompt_response.prompt_token),
        maybe_batch_token: None, // TODO: This should be added soon.
      }).await?;

      info!("Uploaded to API backend: {:?}", result.media_file_token);


      // Clear from SQLite task database.
      if let Some(local_task) = local_tasks_by_sora_task_id.get(task_id.as_str()) {
        info!("Marking local task as failed: {:?}", local_task.id);

        let updated = update_task_status(UpdateTaskArgs {
          db: task_database.get_connection(),
          task_id: &local_task.id,
          status: task_status::TaskStatus::CompleteSuccess,
        }).await?;

        // if !updated {
        //   return Ok(()); // If anything breaks with queries, don't spam events.
        // }
      }

      let event = GenerationCompleteEvent {
        //media_file_token: result.media_file_token,
        action: Some(GenerationAction::GenerateImage),
        service: GenerationServiceProvider::Sora,
        model: None,
      };

      event.send_infallible(&app_handle);
    }

  }

  tokio::time::sleep(std::time::Duration::from_millis(3_000)).await;

  Ok(())
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
