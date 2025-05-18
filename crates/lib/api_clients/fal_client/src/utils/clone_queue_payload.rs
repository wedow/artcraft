use crate::utils::clone_queue_response::clone_queue_response;
use fal::queue::{Queue, QueueResponse};
use serde::de::DeserializeOwned;

pub fn clone_queue_payload<R: DeserializeOwned>(queue: &Queue<R>) -> QueueResponse {
  clone_queue_response(&queue.payload)
}
