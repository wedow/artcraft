use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV2p5TurboStandardImageToVideoInput {
  pub prompt: String,

  /// Starting frame
  pub image_url: String,

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
pub struct KlingV2p5TurboStandardImageToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn kling_v2p5_turbo_standard_image_to_video(
  params: KlingV2p5TurboStandardImageToVideoInput,
) -> FalRequest<KlingV2p5TurboStandardImageToVideoInput, KlingV2p5TurboStandardImageToVideoOutput> {
  FalRequest::new("fal-ai/kling-video/v2.5-turbo/standard/image-to-video", params)
}
