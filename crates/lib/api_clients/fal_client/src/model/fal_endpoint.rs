use fal::queue::Queue;
use serde::de::DeserializeOwned;

const HUNYUAN_3D_2_BASE: &str = "fal-ai/hunyuan3d/v2";

const KLING16_IMAGE_TO_VIDEO: &str = "fal-ai/kling-video/v1.6/pro/image-to-video";

#[derive(Clone, Debug)]
pub enum FalEndpoint {
  Kling16ImageToVideo,
  Hunyuan3d2Base,
  Other(String),
}

impl FalEndpoint {
  pub fn from_queue_response<R: DeserializeOwned>(queue: &Queue<R>) -> Self {
    match queue.endpoint.as_str() {
      HUNYUAN_3D_2_BASE => FalEndpoint::Hunyuan3d2Base,
      KLING16_IMAGE_TO_VIDEO => FalEndpoint::Kling16ImageToVideo,
      _ => FalEndpoint::Other(queue.endpoint.clone()),
    }
  }
  pub fn url(&self) -> &str {
    match self {
      Self::Hunyuan3d2Base => HUNYUAN_3D_2_BASE,
      Self::Kling16ImageToVideo => KLING16_IMAGE_TO_VIDEO,
      Self::Other(url) => url,
    }
  }
}
