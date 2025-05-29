use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceName};
use serde_derive::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub struct GenerationFailedEvent {
  pub service: GenerationServiceName,
  pub action: GenerationAction,

  /// User-facing reason for the failure, if available.
  pub reason: Option<String>,
}

impl BasicSendableEvent for GenerationFailedEvent {
  const FRONTEND_EVENT_NAME: &'static str = "generation-failed-event";
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Failure;
}
