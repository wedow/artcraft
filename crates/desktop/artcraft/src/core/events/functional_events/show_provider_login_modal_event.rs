use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use crate::core::events::sendable_event_error::SendableEventError;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_event_name::TauriEventName;
use log::error;
use serde_derive::Serialize;
use tauri::AppHandle;

/// Send a signal to the frontend to show a modal that suggests service setup.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct ShowProviderLoginModalEvent {
  pub provider: GenerationProvider,
}

impl ShowProviderLoginModalEvent {
  pub fn send_for_provider(provider: GenerationProvider, app: &AppHandle) {
    let event = Self { provider };
    if let Err(err) = event.send(&app) {
      error!("Failed to send ShowProviderLoginModalEvent: {:?}", err); // Fail open
    }
  }
}

impl BasicSendableEvent for ShowProviderLoginModalEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::ShowProviderLoginModalEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Failure;
}
