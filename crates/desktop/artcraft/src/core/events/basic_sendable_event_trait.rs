use crate::core::events::sendable_event_error::SendableEventError;
use log::info;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

// Tagged enums here are waaay too "Rustic"
// #[derive(Clone, Serialize)]
// #[serde(rename_all = "camelCase", rename_all_fields = "camelCase", tag = "event", content = "data")]
// pub enum BasicEvent<T: Serialize> {
//   Success(T),
//   Failure(T),
// }

#[derive(Copy, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum BasicEventStatus {
  Success,
  Failure,
}

/// Wrap the event with "status" and "data" fields.
#[derive(Clone, Serialize)]
#[serde(rename_all = "snake_case")]
struct BasicEventWrapper<T: Serialize> {
  status: BasicEventStatus,
  data: T,
}

pub trait BasicSendableEvent : Serialize {
  /// This is the name of the event that the frontend subscribes to.
  const FRONTEND_EVENT_NAME: &'static str;

  /// This is the status of the event: Success, Failure, etc.
  const EVENT_STATUS: BasicEventStatus;

  /// Default implementation of send().
  /// This serializes and sends the event to the frontend.
  fn send(&self, app: &AppHandle) -> Result<(), SendableEventError> {
    info!("Sending event to frontend: {}", Self::FRONTEND_EVENT_NAME);
    let wrapped = BasicEventWrapper {
      status: Self::EVENT_STATUS,
      data: self.clone(),
    };
    let result = app.emit(Self::FRONTEND_EVENT_NAME, wrapped);
    if let Err(err) = result {
      return Err(SendableEventError::from(err));
    }
    Ok(())
  }
}
