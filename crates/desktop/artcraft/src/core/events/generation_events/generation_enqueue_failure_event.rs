use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use serde_derive::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct GenerationEnqueueFailureEvent {
  pub action: GenerationAction,
  pub service: GenerationServiceProvider,
  pub model: Option<GenerationModel>,

  /// User-facing reason for the failure, if available.
  pub reason: Option<String>,
}

impl BasicSendableEvent for GenerationEnqueueFailureEvent {
  const FRONTEND_EVENT_NAME: &'static str = "generation-enqueue-failure-event";
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Failure;
}
