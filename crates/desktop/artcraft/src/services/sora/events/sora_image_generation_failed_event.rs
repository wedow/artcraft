use serde_derive::Serialize;
use crate::core::events::sendable_event_trait::SendableEvent;

#[derive(Debug, Clone, Serialize)]
pub struct SoraImageGenerationFailedEvent {
  pub prompt: String,
}

impl SendableEvent for SoraImageGenerationFailedEvent {
  const FRONTEND_EVENT_NAME: &'static str = "sora-image-generation-failed";
}

