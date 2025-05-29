use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use serde_derive::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct GenerationEnqueueSuccessEvent {
  pub action: GenerationAction,
  pub service: GenerationServiceProvider,
  pub model: Option<GenerationModel>,
}

impl BasicSendableEvent for GenerationEnqueueSuccessEvent {
  const FRONTEND_EVENT_NAME: &'static str = "generation-enqueue-success-event";
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Success;
}
