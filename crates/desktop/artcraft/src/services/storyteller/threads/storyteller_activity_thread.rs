use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::os_platform::OsPlatform;
use crate::core::state::task_database::TaskDatabase;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::analytics::log_active_user::LogAppActiveUserRequest;
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
use std::time::Instant;
use os_info::Info;
use storyteller_client::analytics::log_active_user::log_active_user;
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::error::api_error::ApiError;
use storyteller_client::error::storyteller_error::StorytellerError;
use storyteller_client::jobs::list_session_jobs::{list_session_jobs, States};
use storyteller_client::media_files::upload_image_media_file_from_file::upload_image_media_file_from_file;
use tauri::AppHandle;

// TODO: Configure this with the build and increment.
const CLIENT_NAME : &str = "artcraft";
const CLIENT_VERSION : &str = "0.0.1";

const ERROR_SLEEP_MILLIS : u64 = 1_000 * 60 * 3; // 3 minutes;

pub async fn storyteller_activity_thread(
  app_env_configs: AppEnvConfigs,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> ! {
  let startup = Instant::now();
  let os_info = os_info::get();
  loop {
    let res = polling_loop(
      &app_env_configs,
      &storyteller_creds_manager,
      startup,
      &os_info,
    ).await;
    if let Err(err) = res {
      error!("An error occurred: {:?}", err);
    }
    // NB: Sleep if an error occurs.
    tokio::time::sleep(std::time::Duration::from_millis(ERROR_SLEEP_MILLIS)).await;
  }
}

async fn polling_loop(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
  startup: Instant,
  os_info: &Info,
) -> AnyhowResult<()> {
  loop {
    let creds = storyteller_creds_manager.get_credentials()?;

    let creds = match creds {
      None => {
        tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;
        continue;
      }
      Some(creds) => {
        if creds.is_empty() {
          tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;
          continue;
        }
        creds
      },
    };

    let time_since_startup = Instant::now().duration_since(startup);

    let maybe_os_platform = OsPlatform::maybe_get_str()
        .map(|s| s.to_string());

    let maybe_os_version = Some(os_info.version().to_string())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let request = LogAppActiveUserRequest {
      maybe_app_name: Some(CLIENT_NAME.to_string()),
      maybe_app_version: Some(CLIENT_VERSION.to_string()),
      maybe_os_platform,
      maybe_os_version,
      maybe_session_duration_seconds: Some(time_since_startup.as_secs()),
    };

    info!("Logging active user with storyteller.");

    let result = log_active_user(
      &app_env_configs.storyteller_host,
      Some(&creds),
      request,
    ).await;

    let wait_millis = match result {
      Ok(result) => result.wait_for_retry_millis,
      Err(err) => {
        match &err {
          StorytellerError::Api(ApiError::TooManyRequests(message)) => {
            error!("Too many requests (sleeping): {:?}", message);
            tokio::time::sleep(std::time::Duration::from_millis(ERROR_SLEEP_MILLIS)).await;
            continue;
          }
          _ => {}
        }
        return Err(anyhow!(err));
      }
    };

    // Wait at least a minute, no matter what the server tells us.
    let wait_millis = std::cmp::min(wait_millis, 60_000);
    tokio::time::sleep(std::time::Duration::from_millis(wait_millis)).await;
  }
}
