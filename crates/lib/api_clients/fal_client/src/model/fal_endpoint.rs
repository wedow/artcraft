use fal::queue::Queue;
use serde::de::DeserializeOwned;

const KLING16_IMAGE_TO_VIDEO: &str = "fal-ai/kling-video/v1.6/pro/image-to-video";
#[derive(Clone, Debug)]
pub enum FalEndpoint {
  Kling16ImageToVideo,
  Other(String),
}

impl FalEndpoint {
  pub fn from_queue_response<R: DeserializeOwned>(queue: &Queue<R>) -> Self {
    match queue.endpoint.as_str() {
      KLING16_IMAGE_TO_VIDEO => FalEndpoint::Kling16ImageToVideo,
      _ => FalEndpoint::Other(queue.endpoint.clone()),
    }
  }
  pub fn url(&self) -> &str {
    match self {
      Self::Kling16ImageToVideo => KLING16_IMAGE_TO_VIDEO,
      Self::Other(url) => url,
    }
  }
}
