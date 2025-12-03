use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV2p6ProTextToVideoInput {
  pub prompt: String,

  /// Aspect ratio
  /// Possible enum values: "16:9", "9:16", "1:1"
  pub aspect_ratio: Option<String>,

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

  /// The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to
  /// stick to your prompt.
  /// Default value: 0.5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub cfg_scale: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KlingV2p6ProTextToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn kling_v2p6_pro_text_to_video(
  params: KlingV2p6ProTextToVideoInput,
) -> FalRequest<KlingV2p6ProTextToVideoInput, KlingV2p6ProTextToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v2.6/pro/text-to-video", params)
}
