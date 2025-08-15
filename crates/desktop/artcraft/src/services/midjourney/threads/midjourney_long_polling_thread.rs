use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::task_database::TaskDatabase;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use errors::AnyhowResult;
use log::error;
use midjourney_client::client::midjourney_hostname::MidjourneyHostname;
use midjourney_client::endpoints::imagine::{imagine, ImagineRequest};
use tauri::AppHandle;

/// This thread is responsible for picking up tasks that fell through the cracks of
/// the faster websocket thread.
pub async fn midjourney_long_polling_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  task_database: TaskDatabase,
  creds: MidjourneyCredentialManager,
) -> ! {
  loop {
    let res = polling_loop(
      &app_handle,
      &app_env_configs,
      &task_database,
      &creds,
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
  creds: &MidjourneyCredentialManager,
) -> AnyhowResult<()> {
  loop {
    if !creds.session_appears_active()? {
      tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
      continue;
    }

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

    let cookie_header = cookies.to_cookie_string();

    let result = imagine(ImagineRequest {
      hostname: MidjourneyHostname::Standard,
      cookie_header,
      user_id,
      page_size: None,
    }).await?;

    println!("Response: {:?}\n\n", result);

    tokio::time::sleep(std::time::Duration::from_millis(60_000)).await;
  }
}
