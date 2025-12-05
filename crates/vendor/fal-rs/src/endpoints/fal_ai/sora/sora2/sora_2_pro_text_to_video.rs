use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Sora2ProTextToVideoInput {
  pub prompt: String,

  /// Possible enum values: auto, 720p, 1080p
  /// Default value auto
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Possible enum values: auto, 9:16, 16:9
  /// Default value "auto"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds
  /// Possible enum values: 4, 8, 12
  /// Default value 4
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<u8>,

  /// Whether to delete the video after generation for privacy reasons.
  /// If True, the video cannot be used for remixing and will be permanently deleted.
  /// Default value: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub delete_video: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Sora2ProTextToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn sora_2_pro_text_to_video(
  params: Sora2ProTextToVideoInput,
) -> FalRequest<Sora2ProTextToVideoInput, Sora2ProTextToVideoOutput> {
  FalRequest::new("fal-ai/sora-2/text-to-video/pro", params)
}
