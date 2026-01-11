use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3dV3TextTo3dInput {
  /// REQUIRED
  pub prompt: String,

  /// Target face count. Range: 40000-1500000 Default value: 500000
  #[serde(skip_serializing_if = "Option::is_none")]
  pub face_count: Option<u32>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_type: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub polygon_type: Option<String>,

  /// Whether to enable PBR material generation.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_pbr: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV3TextTo3dOutput {
  pub model_glb: Hunyuan3dV3TextTo3dModelGlb,
  pub thumbnail: Hunyuan3dV3TextTo3dThumbnail,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV3TextTo3dModelGlb {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV3TextTo3dThumbnail {
  pub url: String,
}

pub fn hunyuan3d_v3_text_to_3d(
  params: Hunyuan3dV3TextTo3dInput,
) -> FalRequest<Hunyuan3dV3TextTo3dInput, Hunyuan3dV3TextTo3dOutput> {
  FalRequest::new("fal-ai/hunyuan3d-v3/text-to-3d", params)
}
