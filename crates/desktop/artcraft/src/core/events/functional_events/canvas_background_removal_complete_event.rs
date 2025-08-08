use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use serde_derive::Serialize;
use url::Url;
use enums::tauri::ux::tauri_event_name::TauriEventName;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct CanvasBackgroundRemovalCompleteEvent {
  pub media_token: MediaFileToken,
  pub image_cdn_url: Url,
}

impl BasicSendableEvent for CanvasBackgroundRemovalCompleteEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::CanvasBgRemovedEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Success;
}
