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
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::common::generation_provider::GenerationProvider;
use enums::common::job_status_plus::JobStatusPlus;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use errors::AnyhowResult;
use log::{error, info};
use reqwest::Url;
use sqlite_tasks::queries::list_tasks_by_provider_and_tokens::{list_tasks_by_provider_and_tokens, ListTasksArgs, Task};
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs};
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::endpoints::jobs::list_session_jobs::{list_session_jobs, States};
use storyteller_client::endpoints::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use storyteller_client::error::api_error::ApiError;
use storyteller_client::error::storyteller_error::StorytellerError;
use tauri::AppHandle;
use tempdir::TempDir;
use tokens::tokens::media_files::MediaFileToken;

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

      let maybe_primary_media_file_token = job.maybe_result
          .as_ref()
          .map(|result| MediaFileToken::new_from_str(&result.entity_token));

      let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
        db: task_database.get_connection(),
        task_id: &task.id,
        maybe_batch_token: job.maybe_result
            .as_ref()
            .map(|result| result.maybe_batch_token.as_ref())
            .flatten(),
        maybe_primary_media_file_token: maybe_primary_media_file_token.as_ref(),
        maybe_primary_media_file_class: get_media_file_class(&job),
        maybe_primary_media_file_thumbnail_url_template: get_thumbnail_template(&job),
        maybe_primary_media_file_cdn_url: job.maybe_result
            .as_ref()
            .map(|result| result.media_links.cdn_url.as_str()),
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

fn get_thumbnail_template<'a>(job: &'a ListSessionJobsItem) -> Option<&'a str> {
  let links = match job.maybe_result.as_ref() {
    None => return None,
    Some(result) => &result.media_links,
  };

  // NB: We only populate video previews for video tasks.
  if let Some(video) = links.maybe_video_previews.as_ref() {
    return Some(&video.animated_thumbnail_template);
  }

  // Last option - use the image thumbnail template if it exists.
  links.maybe_thumbnail_template.as_deref()
}

fn get_media_file_class<'a>(job: &'a ListSessionJobsItem) -> Option<TaskMediaFileClass> {
  match job.request.inference_category {
    InferenceCategory::BackgroundRemoval => return Some(TaskMediaFileClass::Image),
    InferenceCategory::ImageGeneration => return Some(TaskMediaFileClass::Image),
    InferenceCategory::VideoGeneration => return Some(TaskMediaFileClass::Video),
    InferenceCategory::ObjectGeneration => return Some(TaskMediaFileClass::Dimensional),
    _ => {}, // Fall-through
  }

  let result = match job.maybe_result.as_ref() {
    None => return None,
    Some(result) => result,
  };

  let url = result.media_links.cdn_url.as_str();

  if url.ends_with("jpg")
      || url.ends_with("jpeg")
      || url.ends_with("png")
  {
    return Some(TaskMediaFileClass::Image);
  }

  if url.ends_with("mp4")
      || url.ends_with("webm")
  {
    return Some(TaskMediaFileClass::Video);
  }

  if url.ends_with("glb") {
    return Some(TaskMediaFileClass::Dimensional);
  }

  if url.ends_with("wav")
      || url.ends_with("mp3")
  {
    return Some(TaskMediaFileClass::Audio);
  }

  None
}
