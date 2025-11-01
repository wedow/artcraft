use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::state::grok_image_prompt_queue::{GrokImagePromptQueue, PromptItem};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use idempotency::uuid::generate_random_uuid;
use tauri::AppHandle;

pub async fn handle_grok(
  app: &AppHandle,
  request: &EnqueueTextToImageRequest,
  app_env_configs: &AppEnvConfigs,
  creds_manager: &GrokCredentialManager,
  grok_image_prompt_queue: &GrokImagePromptQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {


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

  let job_id = generate_random_uuid();

  let prompt = request.prompt
      .as_deref()
      .map(|prompt| prompt.trim().to_string())
      .unwrap_or_else(|| "".to_string());

  grok_image_prompt_queue.enqueue(PromptItem {
    task_id: job_id.clone(),
    prompt,
  })?;

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Grok,
    model: Some(GenerationModel::GrokImage),
    provider_job_id: Some(job_id),
    task_type: TaskType::ImageGeneration,
  })
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
