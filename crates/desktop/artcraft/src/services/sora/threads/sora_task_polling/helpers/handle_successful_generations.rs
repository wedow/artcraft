use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::sora::threads::sora_task_polling::helpers::download_extension::DownloadExtension;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::tauri::tasks::task_status;
use errors::AnyhowResult;
use idempotency::uuid::generate_random_uuid;
use log::{error, info, warn};
use once_cell::sync::Lazy;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::list_classic_sora_tasks_with_session_auto_renew::list_classic_sora_tasks_with_session_auto_renew;
use openai_sora_client::requests::common::task_id::TaskId;
use openai_sora_client::requests::list_classic_tasks::list_classic_tasks::{PartialGeneration, PartialTaskResponse};
use reqwest::Url;
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs, Task, TaskList};
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use storyteller_client::endpoints::media_files::upload_video_media_file_from_file::{upload_video_media_file_from_file, UploadVideoFromFileArgs};
use storyteller_client::endpoints::prompts::create_prompt::create_prompt;
use tauri::AppHandle;
use tempdir::TempDir;
use url_utils::extension::extract_download_extension_from_url::{extract_download_extension_from_url, extract_download_extension_from_url_str};

pub struct SuccessfulGeneration {
  pub prompt: Option<String>,
  pub items: Vec<GenerationItem>,
  pub model_type: ModelType,
}

pub struct GenerationItem {
  pub item_id: String,
  pub url: String,
}

#[derive(Copy, Clone, Eq, PartialEq)]
enum GenerationType {
  Image,
  Video,
}

pub async fn handle_classic_successful_generations(
  app_handle: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  storyteller_creds: &StorytellerCredentialSet,
  succeeded_tasks_by_id: &HashMap<TaskId, SuccessfulGeneration>,
  sqlite_tasks_by_sora_task_id: &HashMap<String, Task>,
  recommended_download_extension: DownloadExtension,
) -> AnyhowResult<()> {

  for (task_id, generation) in succeeded_tasks_by_id.iter() {
    if !sqlite_tasks_by_sora_task_id.contains_key(task_id.as_str()) {
      continue; // Task is irrelevant - previously completed, generated elsewhere, etc.
    }

    info!("Task succeeded: {:?}", task_id);

    let generation_type = match generation.model_type {
      ModelType::GptImage1 => GenerationType::Image,
      ModelType::Sora2 => GenerationType::Video,
      _ => {
        // Fallback
        warn!("Unexpected model type: {:?}", generation.model_type);
        GenerationType::Image
      },
    };

    let prompt_request = CreatePromptRequest {
      uuid_idempotency_token: generate_random_uuid(),
      positive_prompt: generation.prompt.clone(),
      negative_prompt: None,
      model_type: Some(generation.model_type),
      generation_provider: Some(GenerationProvider::Sora),
    };

    let prompt_response = create_prompt(
      &app_env_configs.storyteller_host,
      Some(&storyteller_creds),
      prompt_request
    ).await?;

    info!("Created prompt: {:?}", &prompt_response.prompt_token);

    for (_i, item) in generation.items.iter().enumerate() {
      info!("Downloading generated file...");
      let download_path = download_generation_item(item, &app_data_root, recommended_download_extension).await?;

      info!("Uploading to backend...");

      match generation_type {
        GenerationType::Image => {
          let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
            api_host: &app_env_configs.storyteller_host,
            maybe_creds: Some(&storyteller_creds),
            path: download_path,
            is_intermediate_system_file: false,
            maybe_prompt_token: Some(&prompt_response.prompt_token),
            maybe_batch_token: None, // TODO: This should be added soon.
          }).await?;

          info!("Uploaded image to API backend: {:?}", result.media_file_token);
        }
        GenerationType::Video => {
          let result = upload_video_media_file_from_file(UploadVideoFromFileArgs {
            api_host: &app_env_configs.storyteller_host,
            maybe_creds: Some(&storyteller_creds),
            path: download_path,
            maybe_prompt_token: Some(&prompt_response.prompt_token),
          }).await?;

          info!("Uploaded video to API backend: {:?}", result.media_file_token);
        }
      }
    }

    // Clear from SQLite task database.
    if let Some(local_task) = sqlite_tasks_by_sora_task_id.get(task_id.as_str()) {
      info!("Marking local task as failed: {:?}", local_task.id);

      let updated = update_task_status(UpdateTaskArgs {
        db: task_database.get_connection(),
        task_id: &local_task.id,
        status: task_status::TaskStatus::CompleteSuccess,
      }).await?;

      if updated {
        // If anything breaks with queries, don't spam events.
        let event = GenerationCompleteEvent {
          action: Some(match generation_type {
            GenerationType::Image => GenerationAction::GenerateImage,
            GenerationType::Video => GenerationAction::GenerateVideo,
          }),
          service: GenerationServiceProvider::Sora,
          model: None,
        };

        event.send_infallible(&app_handle);
      }
    }
  }

  Ok(())
}


async fn download_generation_item(
  generation: &GenerationItem,
  app_data_root: &AppDataRoot,
  recommended_download_extension: DownloadExtension
) -> AnyhowResult<PathBuf> {
  info!("Downloading generation item from URL: {}", generation.url.as_str());

  let response = reqwest::get(&generation.url).await?;
  let image_bytes = response.bytes().await?;

  let extension = extract_download_extension_from_url_str(&generation.url)
      .map(|ext| ext.as_extension_without_period())
      .unwrap_or_else(|| recommended_download_extension.as_extension_without_period());
  
  let tempdir = app_data_root.temp_dir().path();
  let download_filename = format!("{}.{}", generation.item_id, extension);
  let download_path = tempdir.join(download_filename);

  info!("Writing to path: {:?}", download_path);

  let mut file = File::create(&download_path)?;
  file.write_all(&image_bytes)?;

  Ok(download_path)
}
