use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;


/// Used in the `voice_conversion_models` table in `VARCHAR(32)` field `model_type`.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum VoiceConversionModelType {
  #[serde(rename = "soft_vc")]
  SoftVc,

  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,

  #[serde(rename = "rvc")]
  Rvc,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(VoiceConversionModelType);
impl_mysql_enum_coders!(VoiceConversionModelType);

/// NB: Legacy API for older code.
impl VoiceConversionModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::SoftVc => "soft_vc",
      Self::SoVitsSvc => "so_vits_svc",
      Self::Rvc => "rvc",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "soft_vc" => Ok(Self::SoftVc),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      "rvc" => Ok(Self::Rvc),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::SoftVc,
      Self::SoVitsSvc,
      Self::Rvc,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(VoiceConversionModelType::SoftVc, "soft_vc");
    assert_serialization(VoiceConversionModelType::SoVitsSvc, "so_vits_svc");
    assert_serialization(VoiceConversionModelType::Rvc, "rvc");
  }

  #[test]
  fn to_str() {
    assert_eq!(VoiceConversionModelType::SoftVc.to_str(), "soft_vc");
    assert_eq!(VoiceConversionModelType::SoVitsSvc.to_str(), "so_vits_svc");
    assert_eq!(VoiceConversionModelType::Rvc.to_str(), "rvc");
  }

  #[test]
  fn from_str() {
    assert_eq!(VoiceConversionModelType::from_str("soft_vc").unwrap(), VoiceConversionModelType::SoftVc);
    assert_eq!(VoiceConversionModelType::from_str("so_vits_svc").unwrap(), VoiceConversionModelType::SoVitsSvc);
    assert_eq!(VoiceConversionModelType::from_str("rvc").unwrap(), VoiceConversionModelType::Rvc);
  }

  #[test]
  fn all_variants() {
    // Static check
    let mut variants = VoiceConversionModelType::all_variants();
    assert_eq!(variants.len(), 3);
    assert_eq!(variants.pop_first(), Some(VoiceConversionModelType::SoftVc));
    assert_eq!(variants.pop_first(), Some(VoiceConversionModelType::SoVitsSvc));
    assert_eq!(variants.pop_first(), Some(VoiceConversionModelType::Rvc));
    assert_eq!(variants.pop_first(), None);

    // Generated check
    use strum::IntoEnumIterator;
    assert_eq!(VoiceConversionModelType::all_variants().len(), VoiceConversionModelType::iter().len());
  }
}
