use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3dV3SketchTo3dInput {
  /// REQUIRED
  pub prompt: String,

  /// REQUIRED
  pub input_image_url: String,

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
pub struct Hunyuan3dV3SketchTo3dOutput {
  pub model_glb: Hunyuan3dV3SketchTo3dModelGlb,
  pub thumbnail: Hunyuan3dV3SketchTo3dThumbnail,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV3SketchTo3dModelGlb {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV3SketchTo3dThumbnail {
  pub url: String,
}

pub fn hunyuan3d_v3_sketch_to_3d(
  params: Hunyuan3dV3SketchTo3dInput,
) -> FalRequest<Hunyuan3dV3SketchTo3dInput, Hunyuan3dV3SketchTo3dOutput> {
  FalRequest::new("fal-ai/hunyuan3d-v3/sketch-to-3d", params)
}
