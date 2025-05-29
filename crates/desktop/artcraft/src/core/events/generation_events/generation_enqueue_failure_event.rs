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

impl GenerationEnqueueFailureEvent {
  pub fn no_fal_api_key(action: GenerationAction) -> Self {
    Self {
      action,
      service: GenerationServiceProvider::Fal,
      model: None,
      reason: Some("No FAL API key is set. Configure this in your settings.".to_string()),
    }
  }
}
