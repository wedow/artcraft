use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HailuoV2p3ProImageToVideoInput {
  pub prompt: String,

  /// Starting frame
  pub image_url: String,

  /// Default value: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HailuoV2p3ProImageToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn hailuo_v2p3_pro_image_to_video(
  params: HailuoV2p3ProImageToVideoInput,
) -> FalRequest<HailuoV2p3ProImageToVideoInput, HailuoV2p3ProImageToVideoOutput> {
  FalRequest::new("fal-ai/minimax/hailuo-2.3/pro/image-to-video", params)
}
