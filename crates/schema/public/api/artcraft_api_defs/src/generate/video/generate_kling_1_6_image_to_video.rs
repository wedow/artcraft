use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

const GENERATE_KLING_1_6_IMAGE_TO_VIDEO_URL_PATH: &str = "/v1/generate/video/kling_16_image_to_video";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateKling16ImageToVideoRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,
  
  /// Source of the file to remove the background from.
  /// It must be an image.
  pub media_file_token: Option<MediaFileToken>,
  
  /// Optional text prompt.
  pub prompt: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateKling16ImageToVideoResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}
