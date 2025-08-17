use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;

/// Send a signal to the frontend to show a modal that suggests service setup.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct ShowProviderLoginModalEvent {
  pub provider: GenerationProvider,
}

impl BasicSendableEvent for ShowProviderLoginModalEvent{
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::ShowProviderLoginModalEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Failure;
}
