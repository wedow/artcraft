use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use errors::AnyhowResult;
use log::{error, info};
use midjourney_client::client::midjourney_hostname::MidjourneyHostname;
use midjourney_client::endpoints::imagine::{imagine, ImagineRequest};
use midjourney_client::utils::get_image_url::get_image_url;
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use once_cell::sync::Lazy;
use tauri::AppHandle;
use url::Url;
use cookie_store::cookie_store::CookieStore;
use midjourney_client::credentials::midjourney_user_id::MidjourneyUserId;
use midjourney_client::utils::image_downloader_client::ImageDownloaderClient;
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs, Task, TaskList};
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::error::api_error::ApiError;
use storyteller_client::error::storyteller_error::StorytellerError;
use storyteller_client::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::services::midjourney::utils::download_midjourney_image::download_midjourney_image;

static PENDING_STATUSES : Lazy<HashSet<TaskStatus>> = Lazy::new(|| {
  let mut statuses = HashSet::new();
  statuses.insert(TaskStatus::Pending);
  statuses.insert(TaskStatus::Started);
  statuses.insert(TaskStatus::AttemptFailed);
  statuses
});

/// This thread is responsible for picking up tasks that fell through the cracks of
/// the faster websocket thread.
pub async fn midjourney_long_polling_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  app_data_root: AppDataRoot,
  task_database: TaskDatabase,
  creds: MidjourneyCredentialManager,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> ! {
  loop {
    let res = polling_loop(
      &app_handle,
      &app_env_configs,
      &app_data_root,
      &task_database,
      &creds,
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
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  creds: &MidjourneyCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {
  loop {
    if !creds.session_appears_active()? {
      tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
      continue;
    }

    // TODO: Graceful wait, fix this long function body
    let storyteller_creds = match storyteller_creds_manager.get_credentials()? {
      Some(creds) => creds,
      None => {
        error!("No Storyteller credentials found. Cannot proceed with Midjourney polling.");
        tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;
        continue;
      }
    };

    let cookies = creds.maybe_copy_cookie_store()?;

    let cookies = match cookies {
      Some(cookies) => cookies,
      None => {
        tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
        continue;
      }
    };

    let user_info = creds.maybe_copy_user_info()?;

    let maybe_user_id = user_info
        .map(|info| info.user_id)
        .flatten();

    let user_id = match maybe_user_id {
      Some(user_id) => user_id,
      None => {
        tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
        continue;
      }
    };

    let local_tasks = list_tasks_by_provider_and_status(ListTasksByProviderAndStatusArgs {
      db: task_database.get_connection(),
      provider: GenerationProvider::Midjourney,
      task_statuses: &PENDING_STATUSES,
    }).await?;

    check_midjourney_tasks(
      app_handle,
      app_env_configs,
      app_data_root,
      task_database,
      &cookies,
      &user_id,
      &storyteller_creds,
      local_tasks,
    ).await?;

    tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
  }
}

async fn check_midjourney_tasks(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  mj_cookies: &CookieStore,
  mj_user_id: &MidjourneyUserId,
  storyteller_creds: &StorytellerCredentialSet,
  local_tasks: TaskList,
) -> AnyhowResult<()> {
  let local_tasks = local_tasks.tasks;

  if local_tasks.is_empty() {
    return Ok(())
  }

  // Map of Midjourney Job ID to Local Task.
  let local_tasks_by_midjourney_job_id = local_tasks.iter()
      .filter_map(|task| {
        if let Some(provider_job_id) = &task.provider_job_id {
          Some((provider_job_id.clone(), task.clone()))
        } else {
          None
        }
      })
      .collect::<HashMap<String, Task>>();

  let cookie_header = mj_cookies.to_cookie_string();

  let result = imagine(ImagineRequest {
    hostname: MidjourneyHostname::Standard,
    cookie_header,
    user_id: mj_user_id,
    page_size: None,
  }).await?;

  let midjourney_items = result.items;

  let midjourney_items_by_id = {
    let mut hash = HashMap::new();
    for item in midjourney_items.iter() {
      if let Some(id) = &item.id {
        hash.insert(id.to_string(), item.clone());
      }
    }
    hash
  };

  // TODO: If we introduce another job polling mechanism, we may need to handle concurrency.
  //  One idea might be to add a new job state that acts as an optimistic lock

  let image_downloader = ImageDownloaderClient::create()?;

  for (midjourney_job_id, local_task) in local_tasks_by_midjourney_job_id.iter() {
    // TODO: Copy prompt from this.
    let midjourney_item = match midjourney_items_by_id.get(midjourney_job_id) {
      Some(item) => item,
      None => continue,
    };

    for index in 0..4 {
      info!("Downloading generated Midjourney file...");

      let download_path = download_midjourney_image(
        &image_downloader,
        midjourney_job_id,
        index,
        app_data_root
      ).await?;

      let mut wait_delay = 0;

      loop {
        info!("Uploading to backend...");

        let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
          api_host: &app_env_configs.storyteller_host,
          maybe_creds: Some(&storyteller_creds),
          path: &download_path,
          is_intermediate_system_file: false,
        }).await;

        match result {
          Ok(media_file) => {
            info!("Successfully uploaded to backend: {:?}", media_file);
            break;
          },
          Err(StorytellerError::Api(ApiError::TooManyRequests(_))) => {
            error!("Too many requests, retrying upload after delay...");
            // If we hit a rate limit, we can retry after a short delay.
            wait_delay += 10;
            if wait_delay > 60 {
              wait_delay = 60;
            }
            tokio::time::sleep(std::time::Duration::from_secs(wait_delay)).await;
            continue; // Retry the upload.
          }
          Err(err) => {
            error!("Failed to upload to backend: {:?}", err);
            return Err(err.into())
          },
        }
      } // End loop

      tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }

    let updated = update_task_status(UpdateTaskArgs {
      db: task_database.get_connection(),
      task_id: &local_task.id,
      status: TaskStatus::CompleteSuccess,
    }).await?;

    if !updated {
      continue; // If anything breaks with queries, don't spam events.
    }

    let event = GenerationCompleteEvent {
      //media_file_token: result.media_file_token,
      action: Some(GenerationAction::GenerateImage),
      service: GenerationServiceProvider::Midjourney,
      model: None,
    };

    if let Err(err) = event.send(&app_handle) {
      error!("Failed to send GenerationCompleteEvent: {:?}", err); // Fail open
    }

    tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
  }

  tokio::time::sleep(std::time::Duration::from_millis(60_000)).await;

  Ok(())
}
