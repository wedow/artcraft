use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HailuoV2p3FastProImageToVideoInput {
  pub prompt: String,

  /// Starting frame
  pub image_url: String,

  /// Default value: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HailuoV2p3FastProImageToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn hailuo_v2p3_fast_pro_image_to_video(
  params: HailuoV2p3FastProImageToVideoInput,
) -> FalRequest<HailuoV2p3FastProImageToVideoInput, HailuoV2p3FastProImageToVideoOutput> {
  FalRequest::new("fal-ai/minimax/hailuo-2.3-fast/pro/image-to-video", params)
}
