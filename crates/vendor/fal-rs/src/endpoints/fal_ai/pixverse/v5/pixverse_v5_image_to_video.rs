use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PixverseV5ImageToVideoInput {
  pub prompt: String,

  /// Starting frame
  pub image_url: String,

  /// Resolution
  /// Possible enum values: 360p, 540p, 720p, 1080p
  /// Default is 720p
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// The aspect ratio of the generated video
  /// Default value: "16:9"
  /// Possible enum values: 16:9, 4:3, 1:1, 3:4, 9:16
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// Optional negative prompt
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Duration in seconds
  /// Options: "5", "8"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Optional style
  /// Possible enum values: anime, 3d_animation, clay, comic, cyberpunk
  #[serde(skip_serializing_if = "Option::is_none")]
  pub style: Option<String>,

  /// Optional seed
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PixverseV5ImageToVideoOutput {
  pub video: VideoFile,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFile {
  /// The URL where the file can be downloaded from.
  pub url: String,
}

pub fn pixverse_v5_image_to_video(
  params: PixverseV5ImageToVideoInput,
) -> FalRequest<PixverseV5ImageToVideoInput, PixverseV5ImageToVideoOutput> {
  FalRequest::new("fal-ai/pixverse/v5/image-to-video", params)
}
