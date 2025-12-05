use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1FastTextToVideoInput {
  pub prompt: String,

  /// Possible enum values: 9:16, 16:9, 1:1
  /// Default value "16:9"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds
  /// Possible enum values: 4s, 6s, 8s
  /// Default value 8s
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enhance_prompt: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// Whether to automatically attempt to fix prompts that fail content policy or other validation checks by rewriting them
  /// Default value: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub auto_fix: Option<bool>,

  /// Possible enum values: 720p, 1080p
  /// Default value 720p
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Generate audio
  /// Default value "true"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1FastTextToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn veo_3p1_fast_text_to_video(
  params: Veo3p1FastTextToVideoInput,
) -> FalRequest<Veo3p1FastTextToVideoInput, Veo3p1FastTextToVideoOutput> {
  FalRequest::new("fal-ai/veo3.1/fast", params)
}
