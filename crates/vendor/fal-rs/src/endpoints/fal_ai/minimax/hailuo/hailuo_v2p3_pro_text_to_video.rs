use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HailuoV2p3ProTextToVideoInput {
  pub prompt: String,

  /// Default value: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HailuoV2p3ProTextToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn hailuo_v2p3_pro_text_to_video(
  params: HailuoV2p3ProTextToVideoInput,
) -> FalRequest<HailuoV2p3ProTextToVideoInput, HailuoV2p3ProTextToVideoOutput> {
  FalRequest::new("fal-ai/minimax/hailuo-2.3/pro/text-to-video", params)
}
