use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `inference_category`.
///
/// Our "generic inference" pipeline supports a wide variety of ML models and other media.
/// Each "category" of inference is identified by the following enum variants.
/// These types are present in the HTTP API and database columns as serialized here.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default)]
pub enum InferenceCategory {
  /// Eg. SadTalker and possibly Wav2Lip
  #[serde(rename = "lipsync_animation")]
  #[default]
  LipsyncAnimation,

  #[serde(rename = "text_to_speech")]
  TextToSpeech,

  #[serde(rename = "voice_conversion")]
  VoiceConversion,

  #[serde(rename = "video_filter")]
  VideoFilter,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceCategory);
impl_mysql_enum_coders!(InferenceCategory);

/// NB: Legacy API for older code.
impl InferenceCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::LipsyncAnimation => "lipsync_animation",
      Self::TextToSpeech => "text_to_speech",
      Self::VoiceConversion => "voice_conversion",
      Self::VideoFilter => "video_filter",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "lipsync_animation" => Ok(Self::LipsyncAnimation),
      "text_to_speech" => Ok(Self::TextToSpeech),
      "voice_conversion" => Ok(Self::VoiceConversion),
      "video_filter" => Ok(Self::VideoFilter),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::LipsyncAnimation,
      Self::TextToSpeech,
      Self::VoiceConversion,
      Self::VideoFilter,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_inference_jobs::inference_category::InferenceCategory;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(InferenceCategory::LipsyncAnimation, "lipsync_animation");
    assert_serialization(InferenceCategory::TextToSpeech, "text_to_speech");
    assert_serialization(InferenceCategory::VoiceConversion, "voice_conversion");
    assert_serialization(InferenceCategory::VideoFilter, "video_filter");
  }

  #[test]
  fn to_str() {
    assert_eq!(InferenceCategory::LipsyncAnimation.to_str(), "lipsync_animation");
    assert_eq!(InferenceCategory::TextToSpeech.to_str(), "text_to_speech");
    assert_eq!(InferenceCategory::VoiceConversion.to_str(), "voice_conversion");
    assert_eq!(InferenceCategory::VideoFilter.to_str(), "video_filter");
  }

  #[test]
  fn from_str() {
    assert_eq!(InferenceCategory::from_str("lipsync_animation").unwrap(), InferenceCategory::LipsyncAnimation);
    assert_eq!(InferenceCategory::from_str("text_to_speech").unwrap(), InferenceCategory::TextToSpeech);
    assert_eq!(InferenceCategory::from_str("voice_conversion").unwrap(), InferenceCategory::VoiceConversion);
    assert_eq!(InferenceCategory::from_str("video_filter").unwrap(), InferenceCategory::VideoFilter);
  }

  #[test]
  fn all_variants() {
    // Static check
    let mut variants = InferenceCategory::all_variants();
    assert_eq!(variants.len(), 4);
    assert_eq!(variants.pop_first(), Some(InferenceCategory::LipsyncAnimation));
    assert_eq!(variants.pop_first(), Some(InferenceCategory::TextToSpeech));
    assert_eq!(variants.pop_first(), Some(InferenceCategory::VoiceConversion));
    assert_eq!(variants.pop_first(), Some(InferenceCategory::VideoFilter));
    assert_eq!(variants.pop_first(), None);

    // Generated check
    use strum::IntoEnumIterator;
    assert_eq!(InferenceCategory::all_variants().len(), InferenceCategory::iter().len());
  }
}
