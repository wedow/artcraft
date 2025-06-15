use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

pub const GENERATE_FLUX_PRO_ULTRA_TEXT_TO_IMAGE_PATH: &str = "/v1/generate/image/flux_pro_ultra_text_to_image";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateFluxProUltraTextToImageRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateFluxProUltraTextToImageResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}
