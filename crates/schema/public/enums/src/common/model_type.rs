use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 24 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ModelType {
  // Image models
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_pro_1p1")]
  FluxPro11,
  #[serde(rename = "flux_pro_1p1_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "recraft_3")]
  Recraft3,

  // Video models
  #[serde(rename = "kling_1p6_pro")]
  Kling16Pro,
  #[serde(rename = "kling_2p1_pro")]
  Kling21Pro,
  #[serde(rename = "kling_2p1_master")]
  Kling21Master,
  #[serde(rename = "seedance_1p0_lite")]
  Seedance10Lite,
  #[serde(rename = "veo_2")]
  Veo2,

  // 3D Object generation models
  #[serde(rename = "hunyuan_3d_2p0")]
  Hunyuan3d2_0,
  #[serde(rename = "hunyuan_3d_2p1")]
  Hunyuan3d2_1,
}

impl_enum_display_and_debug_using_to_str!(ModelType);
impl_mysql_enum_coders!(ModelType);
impl_mysql_from_row!(ModelType);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl ModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      // Image models
      Self::Flux1Dev => "flux_1_dev",
      Self::Flux1Schnell => "flux_1_schnell",
      Self::FluxPro11 => "flux_pro_1p1",
      Self::FluxPro11Ultra => "flux_pro_1p1_ultra",
      Self::GptImage1 => "gpt_image_1",
      Self::Recraft3 => "recraft_3",

      // Video models
      Self::Kling16Pro => "kling_1p6_pro",
      Self::Kling21Pro => "kling_2p1_pro",
      Self::Kling21Master => "kling_2p1_master",
      Self::Seedance10Lite => "seedance_1p0_lite",
      Self::Veo2 => "veo_2",

      // 3D Object generation models
      Self::Hunyuan3d2_0 => "hunyuan_3d_2p0",
      Self::Hunyuan3d2_1 => "hunyuan_3d_2p1",
    }
  }

  pub fn from_str(job_status: &str) -> Result<Self, String> {
    match job_status {
      // Image models
      "flux_1_dev" => Ok(Self::Flux1Dev),
      "flux_1_schnell" => Ok(Self::Flux1Schnell),
      "flux_pro_1p1" => Ok(Self::FluxPro11),
      "flux_pro_1p1_ultra" => Ok(Self::FluxPro11Ultra),
      "gpt_image_1" => Ok(Self::GptImage1),
      "recraft_3" => Ok(Self::Recraft3),

      // Video models
      "kling_1p6_pro" => Ok(Self::Kling16Pro),
      "kling_2p1_pro" => Ok(Self::Kling21Pro),
      "kling_2p1_master" => Ok(Self::Kling21Master),
      "seedance_1p0_lite" => Ok(Self::Seedance10Lite),
      "veo_2" => Ok(Self::Veo2),

      // 3D Object generation models
      "hunyuan_3d_2p0" => Ok(Self::Hunyuan3d2_0),
      "hunyuan_3d_2p1" => Ok(Self::Hunyuan3d2_1),

      _ => Err(format!("invalid task_state: {:?}", job_status)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      // Image models
      Self::Flux1Dev,
      Self::Flux1Schnell,
      Self::FluxPro11,
      Self::FluxPro11Ultra,
      Self::GptImage1,
      Self::Recraft3,

      // Video models
      Self::Kling16Pro,
      Self::Kling21Pro,
      Self::Kling21Master,
      Self::Seedance10Lite,
      Self::Veo2,

      // 3D Object generation models
      Self::Hunyuan3d2_0,
      Self::Hunyuan3d2_1,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::model_type::ModelType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      // Image models
      assert_serialization(ModelType::Flux1Dev, "flux_1_dev");
      assert_serialization(ModelType::Flux1Schnell, "flux_1_schnell");
      assert_serialization(ModelType::FluxPro11, "flux_pro_1p1");
      assert_serialization(ModelType::FluxPro11Ultra, "flux_pro_1p1_ultra");
      assert_serialization(ModelType::GptImage1, "gpt_image_1");
      assert_serialization(ModelType::Recraft3, "recraft_3");
      // Video models
      assert_serialization(ModelType::Kling16Pro, "kling_1p6_pro");
      assert_serialization(ModelType::Kling21Pro, "kling_2p1_pro");
      assert_serialization(ModelType::Kling21Master, "kling_2p1_master");
      assert_serialization(ModelType::Seedance10Lite, "seedance_1p0_lite");
      assert_serialization(ModelType::Veo2, "veo_2");
      // 3D Object generation models
      assert_serialization(ModelType::Hunyuan3d2_0, "hunyuan_3d_2p0");
      assert_serialization(ModelType::Hunyuan3d2_1, "hunyuan_3d_2p1");
    }

    #[test]
    fn to_str() {
      // Image models
      assert_eq!(ModelType::Flux1Dev.to_str(), "flux_1_dev");
      assert_eq!(ModelType::Flux1Schnell.to_str(), "flux_1_schnell");
      assert_eq!(ModelType::FluxPro11.to_str(), "flux_pro_1p1");
      assert_eq!(ModelType::FluxPro11Ultra.to_str(), "flux_pro_1p1_ultra");
      assert_eq!(ModelType::GptImage1.to_str(), "gpt_image_1");
      assert_eq!(ModelType::Recraft3.to_str(), "recraft_3");

      // Video models
      assert_eq!(ModelType::Kling16Pro.to_str(), "kling_1p6_pro");
      assert_eq!(ModelType::Kling21Pro.to_str(), "kling_2p1_pro");
      assert_eq!(ModelType::Kling21Master.to_str(), "kling_2p1_master");
      assert_eq!(ModelType::Seedance10Lite.to_str(), "seedance_1p0_lite");
      assert_eq!(ModelType::Veo2.to_str(), "veo_2");

      // 3D Object generation models
      assert_eq!(ModelType::Hunyuan3d2_0.to_str(), "hunyuan_3d_2p0");
      assert_eq!(ModelType::Hunyuan3d2_1.to_str(), "hunyuan_3d_2p1");
    }

    #[test]
    fn from_str() {
      // Image models
      assert_eq!(ModelType::from_str("flux_1_dev").unwrap(), ModelType::Flux1Dev);
      assert_eq!(ModelType::from_str("flux_1_schnell").unwrap(), ModelType::Flux1Schnell);
      assert_eq!(ModelType::from_str("flux_pro_1p1").unwrap(), ModelType::FluxPro11);
      assert_eq!(ModelType::from_str("flux_pro_1p1_ultra").unwrap(), ModelType::FluxPro11Ultra);
      assert_eq!(ModelType::from_str("gpt_image_1").unwrap(), ModelType::GptImage1);
      assert_eq!(ModelType::from_str("recraft_3").unwrap(), ModelType::Recraft3);
      // Video models
      assert_eq!(ModelType::from_str("kling_1p6_pro").unwrap(), ModelType::Kling16Pro);
      assert_eq!(ModelType::from_str("kling_2p1_pro").unwrap(), ModelType::Kling21Pro);
      assert_eq!(ModelType::from_str("kling_2p1_master").unwrap(), ModelType::Kling21Master);
      assert_eq!(ModelType::from_str("seedance_1p0_lite").unwrap(), ModelType::Seedance10Lite);
      assert_eq!(ModelType::from_str("veo_2").unwrap(), ModelType::Veo2);
      // 3D Object generation models
      assert_eq!(ModelType::from_str("hunyuan_3d_2p0").unwrap(), ModelType::Hunyuan3d2_0);
      assert_eq!(ModelType::from_str("hunyuan_3d_2p1").unwrap(), ModelType::Hunyuan3d2_1);
    }

    #[test]
    fn all_variants() {
      let mut variants = ModelType::all_variants();
      assert_eq!(variants.len(), 13);
      // Image models
      assert_eq!(variants.pop_first(), Some(ModelType::Flux1Dev));
      assert_eq!(variants.pop_first(), Some(ModelType::Flux1Schnell));
      assert_eq!(variants.pop_first(), Some(ModelType::FluxPro11));
      assert_eq!(variants.pop_first(), Some(ModelType::FluxPro11Ultra));
      assert_eq!(variants.pop_first(), Some(ModelType::GptImage1));
      assert_eq!(variants.pop_first(), Some(ModelType::Recraft3));
      // Video models
      assert_eq!(variants.pop_first(), Some(ModelType::Kling16Pro));
      assert_eq!(variants.pop_first(), Some(ModelType::Kling21Pro));
      assert_eq!(variants.pop_first(), Some(ModelType::Kling21Master));
      assert_eq!(variants.pop_first(), Some(ModelType::Seedance10Lite));
      assert_eq!(variants.pop_first(), Some(ModelType::Veo2));
      // 3D Object generation models
      assert_eq!(variants.pop_first(), Some(ModelType::Hunyuan3d2_0));
      assert_eq!(variants.pop_first(), Some(ModelType::Hunyuan3d2_1));

      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(ModelType::all_variants().len(), ModelType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in ModelType::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, ModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 24;
      for variant in ModelType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
