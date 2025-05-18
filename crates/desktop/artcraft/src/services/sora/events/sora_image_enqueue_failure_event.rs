use crate::events::sendable_event_trait::SendableEvent;
use serde_derive::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct SoraImageEnqueueFailureEvent {
  // TODO: Reason.
}

impl SendableEvent for SoraImageEnqueueFailureEvent {
  const FRONTEND_EVENT_NAME: &'static str = "sora-image-enqueue-failure";
}
