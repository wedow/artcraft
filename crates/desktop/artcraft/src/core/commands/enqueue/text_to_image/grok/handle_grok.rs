use crate::core::commands::enqueue::generate_error::{GenerateError, MissingCredentialsReason, ProviderFailureReason};
use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::{EditImageQuality, EditImageSize};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{EnqueueTextToImageRequest, TextToImageSize};
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::canvas_background_removal_complete_event::CanvasBackgroundRemovalCompleteEvent;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::warning_events::flash_user_input_error_event::FlashUserInputErrorEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::state::grok_websocket_manager::GrokWebsocketManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::image::generate_gpt_image_1_text_to_image::{GenerateGptImage1TextToImageImageQuality, GenerateGptImage1TextToImageImageSize, GenerateGptImage1TextToImageNumImages, GenerateGptImage1TextToImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use grok_client::error::grok_error::GrokError;
use grok_client::requests::image_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
use grok_client::requests::image_websocket::grok_websocket::GrokWebsocket;
use grok_client::requests::image_websocket::listen_for_websocket_request_id::{listen_for_websocket_request_id, ListenForWebsocketRequestIdArgs};
use grok_client::requests::image_websocket::prompt_websocket_image::{prompt_websocket_image, PromptWebsocketImageArgs};
use idempotency::uuid::generate_random_uuid;
use log::{error, info, warn};
use midjourney_client::client::midjourney_hostname::MidjourneyHostname;
use midjourney_client::endpoints::submit_job::{submit_job, SubmitJobRequest};
use midjourney_client::error::midjourney_api_error::MidjourneyApiError;
use midjourney_client::recipes::channel_id::ChannelId;
use midjourney_client::recipes::text_to_image::{text_to_image, TextToImageError, TextToImageRequest};
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use openai_sora_client::recipes::simple_image_gen_with_session_auto_renew::{simple_image_gen_with_session_auto_renew, SimpleImageGenAutoRenewRequest};
use openai_sora_client::requests::image_gen::common::{ImageSize, NumImages};
use std::time::Duration;
use storyteller_client::endpoints::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use storyteller_client::endpoints::generate::image::generate_gpt_image_1_text_to_image::generate_gpt_image_1_text_to_image;
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;

pub async fn handle_grok(
  app: &AppHandle,
  request: &EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  creds_manager: &GrokCredentialManager,
  websocket_manager: &GrokWebsocketManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  unimplemented!()

  //// TODO: We can request population of the user info if absent or expired.
  //let websocket = get_websocket(
  //  app,
  //  creds_manager,
  //  websocket_manager,
  //).await?;
  //
  //let _result = prompt_websocket_image(PromptWebsocketImageArgs {
  //  websocket_wrapped: &websocket,
  //  prompt: request.prompt.as_deref().unwrap_or_else(||""),
  //}).await?;
  //
  //let request_id = listen_for_websocket_request_id(ListenForWebsocketRequestIdArgs {
  //  websocket: &websocket,
  //  timeout: Duration::from_millis(10_000),
  //}).await?;
  //
  //let request_id = match request_id.request_id {
  //  Some(request_id) => request_id.to_string(),
  //  None => {
  //    warn!("No request id from Grok image generation (websocket)");
  //    return Err(GenerateError::ProviderFailure(ProviderFailureReason::GrokJobEnqueueFailed));
  //  }
  //};
  //
  //info!("Successfully enqueued MidJourney. Job token: {}", request_id);

  //Ok(TaskEnqueueSuccess {
  //  provider: GenerationProvider::Grok,
  //  model: Some(GenerationModel::GrokImage),
  //  provider_job_id: Some(request_id),
  //  task_type: TaskType::ImageGeneration,
  //})
}

// TODO:
// fn handle_midjourney_errors(
//   app: &AppHandle,
//   maybe_errors: Option<Vec<TextToImageError>>
// ) -> Result<TaskEnqueueSuccess, GenerateError> {
//   if let Some(errors) = maybe_errors {
//     if !errors.is_empty() {
//       let messages: Vec<String> = errors.iter()
//           .map(|e| format!("{:?}", e))
//           .collect();
//
//       let combined_message = messages.join("; ");
//
//       let event = FlashUserInputErrorEvent {
//         message: format!("Midjourney Error: {}", combined_message),
//       };
//
//       if let Err(err) = event.send(&app) {
//         error!("Failed to send FlashUserInputErrorEvent: {:?}", err); // Fail open
//       }
//     }
//   }
//
//   Err(GenerateError::ProviderFailure(ProviderFailureReason::MidjourneyJobEnqueueFailed))
// }

//async fn get_websocket(app: &AppHandle, creds_manager: &GrokCredentialManager, websocket_manager: &GrokWebsocketManager) -> Result<GrokWebsocket, GenerateError> {
//  let maybe_websocket = websocket_manager.grab_websocket()?;
//
//  let websocket = match maybe_websocket {
//    Some(websocket) => websocket,
//    None => {
//      let cookies = match creds_manager.maybe_copy_cookie_store() {
//        Ok(Some(cookies)) => cookies.to_cookie_string(),
//        Ok(None) => {
//          error!("Grok credentials not found.");
//          ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Grok, &app);
//          return Err(GenerateError::needs_grok_credentials());
//        }
//        Err(err) => {
//          error!("Error reading Midjourney credentials: {:?}", err);
//          ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Grok, &app);
//          return Err(GenerateError::needs_grok_credentials());
//        },
//      };
//
//      info!("Creating Grok websocket...");
//
//      let create_websocket_result = create_listen_websocket(CreateListenWebsocketArgs {
//        cookies: &cookies,
//      }).await;
//
//      let websocket = match create_websocket_result {
//        Ok(websocket) => GrokWebsocket::new(websocket),
//        Err(err) => {
//          error!("Error creating websocket: {:?}", err);
//          ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Grok, &app);
//          return Err(GenerateError::needs_grok_credentials());
//        }
//      };
//
//      info!("Setting managed Grok websocket...");
//      websocket_manager.set_websocket(websocket.clone())?;
//
//      websocket
//    }
//  };
//
//  Ok(websocket)
//}
