use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV2p6ProImageToVideoInput {
  pub prompt: String,

  /// Starting frame
  pub image_url: String,

  /// Generate audio
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Optional negative prompt
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Duration in seconds
  /// Options: "5", "10"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p6ProImageToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn kling_v2p6_pro_image_to_video(
  params: KlingV2p6ProImageToVideoInput,
) -> FalRequest<KlingV2p6ProImageToVideoInput, KlingV2p6ProImageToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v2.6/pro/image-to-video", params)
}
