use crate::core::commands::enqueue::image_edit::errors::InternalContextualEditImageError;
use crate::core::commands::enqueue::image_edit::gpt_image_1::handle_gpt_image_1_edit::handle_gpt_image_1_edit;
use crate::core::commands::enqueue::image_inpaint::errors::InternalImageInpaintError;
use crate::core::commands::enqueue::image_inpaint::flux_pro_1_inpaint::handle_flux_pro_1_inpaint::handle_flux_pro_1_inpaint;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::{Response, ResponseOrErrorType};
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::model::contextual_image_edit_models::ContextualImageEditModel;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download::simple_http_download;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use errors::AnyhowError;
use log::{error, info, warn};
use openai_sora_client::recipes::image_remix_with_session_auto_renew::{image_remix_with_session_auto_renew, ImageRemixAutoRenewRequest};
use openai_sora_client::recipes::image_upload_from_file_with_session_auto_renew::{image_upload_from_file_with_session_auto_renew, ImageUploadFromFileAutoRenewRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use openai_sora_client::sora_error::SoraError;
use serde_derive::{Deserialize, Serialize};
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use std::time::Duration;
use storyteller_client::error::storyteller_error::StorytellerError;
use storyteller_client::media_files::get_media_file::get_media_file;
use storyteller_client::utils::api_host::ApiHost;
use tauri::{AppHandle, Manager, State};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ImageInpaintModel {
  #[serde(rename = "flux_pro_1")]
  FluxPro1,
}

#[derive(Deserialize, Debug)]
pub struct EnqueueInpaintImageCommand {
  /// REQUIRED (Option<T> is just for error messages).
  /// The model to use.
  pub model: Option<ImageInpaintModel>,

  /// REQUIRED (Option<T> is just for error messages).
  /// The source image to edit.
  pub image_media_token: Option<MediaFileToken>,

  /// REQUIRED: Supply this *XOR* `mask_image_raw_bytes`.
  /// The mask to focus the edit (already uploaded).
  pub mask_image_media_token: Option<MediaFileToken>,

  /// REQUIRED: Supply this *XOR* `mask_image_media_token`.
  /// The mask to focus the edit (raw bytes).
  pub mask_image_raw_bytes: Option<Vec<u8>>,

  /// REQUIRED.
  /// The user's image generation prompt.
  pub prompt: String,

  /// Number of images to generate.
  pub image_count: Option<u32>,
  
  /// If true, force the dimensions of the source image and mask image to match.
  pub require_matching_dimensions: Option<bool>,

  /// OPTIONAL.
  /// Name of the frontend caller.
  /// We'll use this to selectively trigger events.
  pub frontend_caller: Option<TauriCommandCaller>,

  /// OPTIONAL.
  /// A frontend-defined identifier that we'll send back to the frontend
  /// as a Tauri event on task completion.
  pub frontend_subscriber_id: Option<String>,

  /// OPTIONAL.
  /// A frontend-defined payload that we'll send back to the frontend
  /// as a Tauri event on task completion.
  pub frontend_subscriber_payload: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum EnqueueInpaintImageErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified,

  /// No model available for image generation
  NoProviderAvailable,

  /// No source image was supplied.
  NoSourceImageSpecified,

  /// No mask image was supplied.
  NoMaskImageSpecified,

  /// Too many mask images were supplied.
  MultipleMaskImagesSpecified,

  /// Bad mask image was supplied.
  BadMaskImage,
  
  /// Generic bad request error
  BadRequest,

  /// Generic server error
  ServerError,
}

#[derive(Serialize)]
pub struct EnqueueImageInpaintSuccessResponse {
}

impl SerializeMarker for EnqueueImageInpaintSuccessResponse {}

#[tauri::command]
pub async fn enqueue_image_inpaint_command(
  app: AppHandle,
  request: EnqueueInpaintImageCommand,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  fal_creds_manager: State<'_, FalCredentialManager>,
  fal_task_queue: State<'_, FalTaskQueue>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> ResponseOrErrorType<EnqueueImageInpaintSuccessResponse, EnqueueInpaintImageErrorType> {

  info!("enqueue_image_inpaint_command called; model: {:?}, image_media_token: {:?}, prompt: {:?}",
    &request.model, &request.image_media_token, &request.prompt);

  let result = handle_request(
    &request,
    &app,
    &app_data_root,
    &app_env_configs,
    &provider_priority_store,
    &task_database,
    &storyteller_creds_manager,
    &fal_creds_manager,
    &fal_task_queue,
    &sora_creds_manager,
    &sora_task_queue,
  ).await;

  match result {
    Err(err) => {
      error!("Error enqueuing inpaint image: {:?}", err);

      // TODO: Derive from err. Make service provider optional.
      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::GenerateImage,
        service: GenerationServiceProvider::Artcraft, // FIXME: This is wrong.
        model: None,
        reason: None,
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      Err(err.to_tauri_response())
    }
    Ok(event) => {
      let event = GenerationEnqueueSuccessEvent {
        action: event.to_frontend_event_action(),
        service: event.to_frontend_event_service(),
        model: event.model,
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      Ok(EnqueueImageInpaintSuccessResponse {}.into())
    }
  }
}

pub async fn handle_request(
  request: &EnqueueInpaintImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  fal_creds_manager: &FalCredentialManager,
  fal_task_queue: &FalTaskQueue,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalImageInpaintError> {
  let success_event= match request.model {
    None => {
      return Err(InternalImageInpaintError::NoModelSpecified)
    }
    Some(ImageInpaintModel::FluxPro1) => {
      handle_flux_pro_1_inpaint(
        request,
        app,
        app_data_root,
        app_env_configs,
        provider_priority_store,
        storyteller_creds_manager,
        fal_creds_manager,
        fal_task_queue,
        sora_creds_manager,
        sora_task_queue,
      ).await?
    }
  };

  let result = success_event
      .insert_into_task_database_with_frontend_payload(
        task_database,
        request.frontend_caller,
        request.frontend_subscriber_id.as_deref(),
        request.frontend_subscriber_payload.as_deref()
      )
      .await;

  if let Err(err) = result {
    error!("Failed to create task in database: {:?}", err);
    // NB: Fail open, but find a way to flag this.
  }

  Ok(success_event)
}
