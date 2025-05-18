use serde_derive::Serialize;
use tokens::tokens::media_files::MediaFileToken;
use crate::events::sendable_event_trait::SendableEvent;

#[derive(Debug, Clone, Serialize)]
pub struct SoraImageGenerationCompleteEvent {
  pub media_file_token: MediaFileToken,
}

impl SendableEvent for SoraImageGenerationCompleteEvent {
  const FRONTEND_EVENT_NAME: &'static str = "sora-image-generation-complete";
}
