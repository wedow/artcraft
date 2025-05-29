use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceName};
use serde_derive::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub struct GenerationEnqueueSuccessEvent {
  pub service: GenerationServiceName,
  pub action: GenerationAction,
}

impl BasicSendableEvent for GenerationEnqueueSuccessEvent {
  const FRONTEND_EVENT_NAME: &'static str = "generation-enqueue-success-event";
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Success;
}
