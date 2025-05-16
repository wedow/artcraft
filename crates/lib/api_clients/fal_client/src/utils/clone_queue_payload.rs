use fal::queue::{Queue, QueueResponse};
use serde::de::DeserializeOwned;

pub fn clone_queue_payload<R: DeserializeOwned>(payload: &Queue<R>) -> QueueResponse {
  // TODO...
}