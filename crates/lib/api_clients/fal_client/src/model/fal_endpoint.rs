#[derive(Clone, Copy, Debug)]
pub enum FalEndpoint {
  Kling16ImageToVideo,
}

impl FalEndpoint {
  pub fn url(&self) -> String {
    match self {
      FalEndpoint::Kling16ImageToVideo => "https://api.fal.ai/v1/kling16/image-to-video".to_string(),
    }
  }
}
