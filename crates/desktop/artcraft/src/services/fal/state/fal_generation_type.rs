use crate::core::events::generation_events::common::GenerationAction;
use fal_client::model::fal_endpoint::FalEndpoint;

/// Adapter of generation types/categories for FAL
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FalGenerationType {
  TextToImage,
  ImageToImage,
  TextToVideo,
  ImageToVideo,
  ImageTo3d,
  ImageBackgroundRemoval,
}

impl FalGenerationType {
  pub fn from_fal_endpoint(endpoint: &FalEndpoint) -> Option<Self> {
    match endpoint {
      FalEndpoint::FluxProUltraTextToImage => Some(Self::TextToImage),
      FalEndpoint::Hunyuan3d2Base => Some(Self::ImageTo3d),
      FalEndpoint::Kling16ImageToVideo => Some(Self::ImageToVideo),
      FalEndpoint::Minimax01ImageToVideo => Some(Self::ImageToVideo),
      FalEndpoint::RecraftV3TextToImage => Some(Self::TextToImage),
      FalEndpoint::Other(_) => None,
    }
  }
  
  pub fn to_event_generation_action(&self) -> GenerationAction {
    match self {
      Self::TextToImage => GenerationAction::GenerateImage,
      Self::ImageToImage => GenerationAction::GenerateImage,
      Self::TextToVideo => GenerationAction::GenerateVideo,
      Self::ImageToVideo => GenerationAction::GenerateVideo,
      Self::ImageTo3d => GenerationAction::ImageTo3d,
      Self::ImageBackgroundRemoval => GenerationAction::RemoveBackground,
    }
  }
}