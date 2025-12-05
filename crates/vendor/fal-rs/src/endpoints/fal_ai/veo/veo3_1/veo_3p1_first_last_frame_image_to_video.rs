use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1FirstLastFrameImageToVideoInput {
  pub prompt: String,

  /// Starting frame
  pub first_frame_url: String,

  /// Ending frame
  pub last_frame_url: String,

  /// Duration in seconds
  /// Possible enum values: 4s, 6s, 8s
  /// Default value 8s
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Possible enum values: auto, 9:16, 16:9, 1:1
  /// Default value "auto"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Possible enum values: 720p, 1080p
  /// Default value 720p
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// Generate audio
  /// Defaults to "true"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1FirstLastFrameImageToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn veo_3p1_first_last_frame_image_to_video(
  params: Veo3p1FirstLastFrameImageToVideoInput,
) -> FalRequest<Veo3p1FirstLastFrameImageToVideoInput, Veo3p1FirstLastFrameImageToVideoOutput> {
  FalRequest::new("fal-ai/veo3.1/first-last-frame-to-video", params)
}
