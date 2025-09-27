use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::enum_conversion::generation_provider::to_generation_service_provider;
use crate::core::utils::enum_conversion::task_type::to_generation_action;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::threads::events::maybe_handle_inpainting_complete_event::maybe_handle_inpainting_complete_event;
use crate::services::storyteller::threads::events::maybe_handle_text_to_image_complete_event::maybe_handle_text_to_image_complete_event;
use crate::services::storyteller::threads::events::maybe_send_background_removal_complete_event::maybe_send_background_removal_complete_event;
use anyhow::anyhow;
use artcraft_api_defs::jobs::list_session_jobs::ListSessionJobsItem;
use enums::common::generation_provider::GenerationProvider;
use enums::common::job_status_plus::JobStatusPlus;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use errors::AnyhowResult;
use log::{error, info};
use reqwest::Url;
use sqlite_tasks::queries::list_tasks_by_provider_and_tokens::{list_tasks_by_provider_and_tokens, ListTasksArgs, Task};
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::error::api_error::ApiError;
use storyteller_client::error::storyteller_error::StorytellerError;
use storyteller_client::endpoints::jobs::list_session_jobs::{list_session_jobs, States};
use storyteller_client::endpoints::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use tauri::AppHandle;
use tempdir::TempDir;

pub async fn storyteller_task_polling_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  task_database: TaskDatabase,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> ! {
  loop {
    let res = polling_loop(
      &app_handle,
      &app_env_configs,
      &task_database,
      &storyteller_creds_manager,
    ).await;
    if let Err(err) = res {
      error!("An error occurred: {:?}", err);
    }
    // NB: Only sleep if an error occurs.
    tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
  }
}

async fn polling_loop(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {
  loop {
    // Wait before next request for jobs.
    tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;

    let creds = storyteller_creds_manager.get_credentials()?;

    let result = list_session_jobs(
      &app_env_configs.storyteller_host,
      creds.as_ref(),
      States::All,
    ).await;

    let jobs = match result {
      Ok(result) => result.jobs,
      Err(err) => {
        match &err {
          StorytellerError::Api(ApiError::TooManyRequests(message)) => {
            error!("Too many requests (sleeping): {:?}", message);
            tokio::time::sleep(std::time::Duration::from_millis(60_000)).await;
          }
          _ => {}
        }
        return Err(anyhow!(err));
      }
    };

    let job_ids = jobs.iter()
        .map(|job| job.job_token.to_string())
        .collect::<Vec<_>>();

    let tasks = list_tasks_by_provider_and_tokens(ListTasksArgs {
      db: task_database.get_connection(),
      provider: GenerationProvider::Artcraft,
      provider_job_ids: Some(job_ids),
    }).await?;

    let tasks = tasks.tasks;

    let jobs_by_id = jobs.iter()
        .map(|job| (job.job_token.to_string(), job))
        .collect::<HashMap<String, _>>();

    let tasks_by_provider_job_id = tasks.iter()
        .filter_map(|task| {
          if let Some(provider_job_id) = &task.provider_job_id {
            Some((provider_job_id.clone(), task.clone()))
          } else {
            None
          }
        })
        //.map(|task| (task.provider_job_id.clone(), task.clone()))
        .collect::<HashMap<String, Task>>();

    for job in jobs.iter() {
      match job.status.status {
        JobStatusPlus::CompleteSuccess => {} // Fall-through.
        _ => continue,
      }

      let task = match tasks_by_provider_job_id.get(job.job_token.as_str()) {
        Some(job) => job,
        None => continue,
      };

      match task.status {
        TaskStatus::CompleteSuccess => continue,
        _ => {} // Fall-through.
      }

      let updated = update_task_status(UpdateTaskArgs {
        db: task_database.get_connection(),
        task_id: &task.id,
        status: TaskStatus::CompleteSuccess,
      }).await?;

      if !updated {
        continue; // If anything breaks with queries, don't spam events.
      }

      send_additional_events(
        &app_handle,
        &app_env_configs,
        creds.as_ref(),
        &job,
        &task,
      ).await;

      let service = to_generation_service_provider(task.provider);
      let action = to_generation_action(task.task_type);

      let event = GenerationCompleteEvent {
        action: Some(action),
        service,
        model: None, // TODO
      };

      if let Err(err) = event.send(&app_handle) {
        error!("Failed to send GenerationCompleteEvent: {:?}", err); // Fail open
      }
    }

  }
}

async fn send_additional_events(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  creds: Option<&StorytellerCredentialSet>,
  job: &ListSessionJobsItem,
  task: &Task
) {
  info!("Attempting to dispatch events for completed Storyteller : {:?}", task);

  let result = maybe_handle_text_to_image_complete_event(
    app_handle,
    app_env_configs,
    creds,
    task,
    job,
  ).await;

  if let Err(err) = result {
    error!("Failed to send text-to-image complete event: {:?}", err);
  }

  let result = maybe_handle_inpainting_complete_event(
    app_handle,
    app_env_configs,
    creds,
    task,
    job,
  ).await;

  if let Err(err) = result {
    error!("Failed to send image inpainting complete event: {:?}", err);
  }

  let result = maybe_send_background_removal_complete_event(
    app_handle,
    task,
    job,
  ).await;

  if let Err(err) = result {
    error!("Failed to send background removal complete event: {:?}", err);
  }
}
