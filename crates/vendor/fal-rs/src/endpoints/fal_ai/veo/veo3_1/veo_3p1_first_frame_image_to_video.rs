use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Veo3p1FirstFrameImageToVideoInput {
  pub prompt: String,

  /// Starting frame
  pub image_url: String,

  /// Possible enum values: 9:16, 16:9 (NB: This differs from first-frame/last-frame)
  /// Default value "16:9"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Duration in seconds
  /// Possible enum values: 4s, 6s, 8s
  /// Default value 8s
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Generate audio
  /// Default value "true"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Possible enum values: 720p, 1080p
  /// Default value 720p
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Veo3p1FirstFrameImageToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn veo_3p1_first_frame_image_to_video(
  params: Veo3p1FirstFrameImageToVideoInput,
) -> FalRequest<Veo3p1FirstFrameImageToVideoInput, Veo3p1FirstFrameImageToVideoOutput> {
  FalRequest::new("fal-ai/veo3.1/image-to-video", params)
}
