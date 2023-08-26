use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;


/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `maybe_model_type`.
///
/// Our "generic inference" pipeline supports a wide variety of ML models and other media.
/// Each inference "model type" identified by the following enum variants, though some pipelines
/// may use multiple models or no model (and may report NULL).
///
/// These types are present in the HTTP API and database columns as serialized here.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum InferenceModelType {
  #[serde(rename = "rvc_v2")]
  RvcV2,

  // NB: sad_talker does use user-supplied models, so there is no "model token"
  #[serde(rename = "sad_talker")]
  SadTalker,

  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,

  // TODO: Does this need to be "legacy_tacotron2" ?
  #[serde(rename = "tacotron2")]
  Tacotron2,

  #[serde(rename = "vits")]
  Vits,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceModelType);
impl_mysql_enum_coders!(InferenceModelType);

/// NB: Legacy API for older code.
impl InferenceModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::RvcV2 => "rvc_v2",
      Self::SadTalker => "sad_talker",
      Self::SoVitsSvc => "so_vits_svc",
      Self::Tacotron2 => "tacotron2",
      Self::Vits => "vits",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "rvc_v2" => Ok(Self::RvcV2),
      "sad_talker" => Ok(Self::SadTalker),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      "tacotron2" => Ok(Self::Tacotron2),
      "vits" => Ok(Self::Vits),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<InferenceModelType> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      InferenceModelType::RvcV2,
      InferenceModelType::SadTalker,
      InferenceModelType::SoVitsSvc,
      InferenceModelType::Tacotron2,
      InferenceModelType::Vits,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(InferenceModelType::RvcV2, "rvc_v2");
    assert_serialization(InferenceModelType::SadTalker, "sad_talker");
    assert_serialization(InferenceModelType::SoVitsSvc, "so_vits_svc");
    assert_serialization(InferenceModelType::Tacotron2, "tacotron2");
    assert_serialization(InferenceModelType::Vits, "vits");
  }

  #[test]
  fn to_str() {
    assert_eq!(InferenceModelType::RvcV2.to_str(), "rvc_v2");
    assert_eq!(InferenceModelType::SadTalker.to_str(), "sad_talker");
    assert_eq!(InferenceModelType::SoVitsSvc.to_str(), "so_vits_svc");
    assert_eq!(InferenceModelType::Tacotron2.to_str(), "tacotron2");
    assert_eq!(InferenceModelType::Vits.to_str(), "vits");
  }

  #[test]
  fn from_str() {
    assert_eq!(InferenceModelType::from_str("rvc_v2").unwrap(), InferenceModelType::RvcV2);
    assert_eq!(InferenceModelType::from_str("sad_talker").unwrap(), InferenceModelType::SadTalker);
    assert_eq!(InferenceModelType::from_str("so_vits_svc").unwrap(), InferenceModelType::SoVitsSvc);
    assert_eq!(InferenceModelType::from_str("tacotron2").unwrap(), InferenceModelType::Tacotron2);
    assert_eq!(InferenceModelType::from_str("vits").unwrap(), InferenceModelType::Vits);
  }

  #[test]
  fn all_variants() {
    // Static check
    let mut variants = InferenceModelType::all_variants();
    assert_eq!(variants.len(), 5);
    assert_eq!(variants.pop_first(), Some(InferenceModelType::RvcV2));
    assert_eq!(variants.pop_first(), Some(InferenceModelType::SadTalker));
    assert_eq!(variants.pop_first(), Some(InferenceModelType::SoVitsSvc));
    assert_eq!(variants.pop_first(), Some(InferenceModelType::Tacotron2));
    assert_eq!(variants.pop_first(), Some(InferenceModelType::Vits));
    assert_eq!(variants.pop_first(), None);

    // Generated check
    use strum::IntoEnumIterator;
    assert_eq!(InferenceModelType::all_variants().len(), InferenceModelType::iter().len());
  }
}
