use crate::core::events::sendable_event_trait::SendableEvent;
use serde_derive::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct SoraImageEnqueueSuccessEvent {
  // TODO: Token, etc.
}

impl SendableEvent for SoraImageEnqueueSuccessEvent {
  const FRONTEND_EVENT_NAME: &'static str = "sora-image-enqueue-success";
}
