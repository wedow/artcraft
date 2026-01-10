use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3dV3ImageTo3dInput {
  /// REQUIRED
  pub input_image_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub back_image_url : Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub left_image_url : Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub right_image_url : Option<String>,

  /// Target face count. Range: 40000-1500000 Default value: 500000
  #[serde(skip_serializing_if = "Option::is_none")]
  pub face_count: Option<u32>,

  /// Generation type.
  /// Normal: textured model.
  /// LowPoly: polygon reduction.
  /// Geometry: white model without texture.
  /// Default value: "Normal"
  /// Possible enum values: Normal, LowPoly, Geometry
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_type: Option<String>,

  /// Polygon type. Only takes effect when GenerateType is LowPoly.
  /// Default value: "triangle"
  /// Possible enum values: triangle, quadrilateral
  #[serde(skip_serializing_if = "Option::is_none")]
  pub polygon_type: Option<String>,

  /// Whether to enable PBR material generation.
  /// Does not take effect when generate_type is Geometry.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_pbr: Option<bool>,

}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV3ImageTo3dOutput {
  pub model_glb: Hunyuan3dV3ImageTo3dModelGlb,
  pub thumbnail: Hunyuan3dV3ImageTo3dThumbnail,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV3ImageTo3dModelGlb {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV3ImageTo3dThumbnail {
  pub url: String,
}

pub fn hunyuan3d_v3_image_to_3d(
  params: Hunyuan3dV3ImageTo3dInput,
) -> FalRequest<Hunyuan3dV3ImageTo3dInput, Hunyuan3dV3ImageTo3dOutput> {
  FalRequest::new("fal-ai/hunyuan3d-v3/image-to-3d", params)
}
