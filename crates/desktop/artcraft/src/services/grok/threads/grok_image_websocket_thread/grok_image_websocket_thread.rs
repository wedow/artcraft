use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::download_url_to_temp_dir::download_url_to_temp_dir;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::state::grok_image_prompt_queue::GrokImagePromptQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::tauri::tasks::task_model_type::TaskModelType;
use errors::AnyhowResult;
use grok_client::requests::image_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
use grok_client::requests::image_websocket::grok_websocket::GrokWebsocket;
use grok_client::requests::image_websocket::listen_for_websocket_images::{listen_for_websocket_images, ImageResults, ListenForWebsocketImagesArgs};
use grok_client::requests::image_websocket::prompt_websocket_image::{prompt_websocket_image, PromptWebsocketImageArgs};
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs};
use std::time::Duration;
use storyteller_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs, UploadImageMediaFileSuccessResponse};
use storyteller_client::endpoints::prompts::create_prompt::create_prompt;
use storyteller_client::error::api_error::ApiError;
use storyteller_client::error::storyteller_error::StorytellerError;
use tauri::AppHandle;
use tokens::tokens::batch_generations::BatchGenerationToken;

pub async fn grok_image_websocket_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  app_data_root: AppDataRoot,
  task_database: TaskDatabase,
  creds: GrokCredentialManager,
  prompt_queue: GrokImagePromptQueue,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> ! {
  loop {
    let res = inner_loop(
      &app_handle,
      &app_env_configs,
      &app_data_root,
      &task_database,
      &creds,
      &prompt_queue,
      &storyteller_creds_manager,
    ).await;
    if let Err(err) = res {
      error!("An error occurred: {:?}", err);
    }
    // NB: Only sleep if an error occurs.
    tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
  }
}

async fn inner_loop(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  grok_creds: &GrokCredentialManager,
  prompt_queue: &GrokImagePromptQueue,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {

  loop {
    if !grok_creds.do_task_polling()? {
      tokio::time::sleep(std::time::Duration::from_millis(10_000)).await;
      continue;
    }

    let maybe_cookie_header = grok_creds.maybe_copy_cookie_header_string()?;

    let cookie_header = match maybe_cookie_header {
      Some(cookie_header) => cookie_header,
      None => {
        tokio::time::sleep(std::time::Duration::from_millis(10_000)).await;
        continue;
      }
    };

    let websocket = create_listen_websocket(CreateListenWebsocketArgs {
      cookies: &cookie_header,
    }).await?;

    let websocket = GrokWebsocket::new(websocket);

    //poll_task_loop(
    //  &app_handle,
    //  &app_env_configs,
    //  &app_data_root,
    //  &task_database,
    //  &grok_creds,
    //  websocket,
    //  prompt_queue,
    //  &storyteller_creds_manager,
    //).await?;

    loop {
      // let local_tasks = list_tasks_by_provider_and_status(ListTasksByProviderAndStatusArgs {
      //   db: task_database.get_connection(),
      //   provider: GenerationProvider::Grok,
      //   task_statuses: &TASK_DATABASE_PENDING_STATUSES,
      // }).await?;
      // // Only Grok images
      // let local_tasks = local_tasks.tasks.into_iter()
      //     .filter(|task| match task.model_type {
      //       Some(TaskModelType::GrokImage) => true,
      //       _ => false,
      //     })
      //     .collect::<Vec<_>>();

      let maybe_prompt = prompt_queue.dequeue()?;

      let prompt = match maybe_prompt {
        Some(prompt) => prompt,
        None => {
          tokio::time::sleep(std::time::Duration::from_millis(1_000)).await;
          continue;
        }
      };

      info!("Prompting Grok websocket: {}", prompt);

      let _result = prompt_websocket_image(PromptWebsocketImageArgs {
        websocket_wrapped: &websocket,
        prompt: &prompt,
      }).await?;

      let images = listen_for_websocket_images(ListenForWebsocketImagesArgs {
        websocket: &websocket,
        timeout: Duration::from_millis(30_000),
      }).await?;

      upload_images_to_storyteller(
        &app_handle,
        &app_env_configs,
        &app_data_root,
        &task_database,
        &storyteller_creds_manager,
        &prompt,
        &images,
      ).await?
    }

  }
}

//async fn poll_task_loop(
//  app_handle: &AppHandle,
//  app_env_configs: &AppEnvConfigs,
//  app_data_root: &AppDataRoot,
//  task_database: &TaskDatabase,
//  grok_creds: &GrokCredentialManager,
//  grok_websocket: GrokWebsocket,
//  prompt_queue: &GrokImagePromptQueue,
//  storyteller_creds_manager: &StorytellerCredentialManager,
//) -> AnyhowResult<()> {
//
//}

async fn upload_images_to_storyteller(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  prompt: &str,
  images: &ImageResults,
) -> AnyhowResult<()> {

  loop {
    let storyteller_creds = match storyteller_creds_manager.get_credentials()? {
      Some(creds) => creds,
      None => {
        error!("No Storyteller credentials found. Cannot proceed with Grok polling.");
        tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;
        continue;
      }
    };

    let request = CreatePromptRequest {
      uuid_idempotency_token: generate_random_uuid(),
      positive_prompt: Some(prompt.trim().to_string()),
      negative_prompt: None,
      model_type: Some(ModelType::GrokImage),
      generation_provider: Some(GenerationProvider::Grok),
    };

    let prompt_response = create_prompt(
      &app_env_configs.storyteller_host,
      Some(&storyteller_creds),
      request
    ).await?;

    info!("Created prompt: {:?}", &prompt_response.prompt_token);

    // TODO: Move this from clientside to the backend.
    //  The first upload should produce a batch token that we can reuse.
    let batch_token = BatchGenerationToken::generate();

    for image in images.images.iter() {
      loop {
        let url = image.url.to_string();
        let file = download_url_to_temp_dir(&url, app_data_root).await?;

        let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
          api_host: &app_env_configs.storyteller_host,
          maybe_creds: Some(&storyteller_creds),
          path: file.path(),
          is_intermediate_system_file: false,
          maybe_prompt_token: Some(&prompt_response.prompt_token),
          maybe_batch_token: Some(&batch_token),
        }).await;

        match result {
          Ok(_) => {
            break;
          }
          Err(StorytellerError::Api(ApiError::TooManyRequests(_))) => {
            tokio::time::sleep(std::time::Duration::from_millis(10_000)).await;
            continue;
          }
          Err(err) => {
            error!("Error uploading image: {}", err);
            break;
          }
        }
      } // Retry on 429s, etc.
    }

    return Ok(())
  }
}
