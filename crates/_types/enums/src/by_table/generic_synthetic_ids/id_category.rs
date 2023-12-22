use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `generic_synthetic_ids` table in `VARCHAR(32)` field `id_category`.
///
/// This lets us create synthetic increment IDs on a per-user, per-category basis.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum IdCategory {
  /// media_files table
  #[serde(rename = "media_file")]
  MediaFile,

  /// Results from lipsync animations (which may live in the media_files table)
  #[serde(rename = "lipsync_animation")]
  LipsyncAnimationResult,

  // Results from video filters
  #[serde(rename = "video_filter")]
  VideoFilterResult,

  /// Results from tacotron2
  /// Applies for RVC and SVC
  #[serde(rename = "tts_result")]
  TtsResult,

  /// Results from voice conversion (which may live in the media_files table)
  /// Applies for RVC and SVC
  #[serde(rename = "voice_conversion")]
  VoiceConversionResult,

  /// Results from the zero shot tts (which may live in the media_files table)
  #[serde(rename = "zs_tts_result")]
  ZeroShotTtsResult,

  /// Zs dataset which lives in the zs_voice_datasets table
  #[serde(rename = "zs_dataset")]
  ZeroShotVoiceDataset,

  /// Zs voice which lives in the zs_voices table
  #[serde(rename = "zs_voice")]
  ZeroShotVoiceEmbedding,

  #[serde(rename = "model_weights")]
  ModelWeights,

  /// Files that are uploaded with no general product area they belong to. (Eg. local dev testing)
  #[serde(rename = "file_upload")]
  FileUpload,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(IdCategory);
impl_mysql_enum_coders!(IdCategory);

/// NB: Legacy API for older code.
impl IdCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaFile => "media_file",
      Self::LipsyncAnimationResult => "lipsync_animation",
      Self::TtsResult => "tts_result",
      Self::VoiceConversionResult => "voice_conversion",
      Self::ZeroShotVoiceDataset => "zs_dataset",
      Self::ZeroShotVoiceEmbedding => "zs_voice",
      Self::ZeroShotTtsResult => "zs_tts_result",
      Self::VideoFilterResult => "video_filter",
      Self::ModelWeights => "model_weights",
      Self::FileUpload => "file_upload",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_file" => Ok(Self::MediaFile),
      "lipsync_animation" => Ok(Self::LipsyncAnimationResult),
      "tts_result" => Ok(Self::TtsResult),
      "voice_conversion" => Ok(Self::VoiceConversionResult),
      "zs_dataset" => Ok(Self::ZeroShotVoiceDataset),
      "zs_voice" => Ok(Self::ZeroShotVoiceEmbedding),
      "zs_tts_result" => Ok(Self::ZeroShotTtsResult),
      "video_filter" => Ok(Self::VideoFilterResult),
      "model_weights" => Ok(Self::ModelWeights),
      "file_upload" => Ok(Self::FileUpload),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::MediaFile,
      Self::LipsyncAnimationResult,
      Self::VideoFilterResult,
      Self::TtsResult,
      Self::VoiceConversionResult,
      Self::ZeroShotTtsResult,
      Self::ZeroShotVoiceDataset,
      Self::ZeroShotVoiceEmbedding,
      Self::ModelWeights,
      Self::FileUpload,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_synthetic_ids::id_category::IdCategory;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

  #[test]
  fn test_serialization() {
    assert_serialization(IdCategory::MediaFile, "media_file");
    assert_serialization(IdCategory::LipsyncAnimationResult, "lipsync_animation");
    assert_serialization(IdCategory::VideoFilterResult, "video_filter");
    assert_serialization(IdCategory::TtsResult, "tts_result");
    assert_serialization(IdCategory::VoiceConversionResult, "voice_conversion");
    assert_serialization(IdCategory::ZeroShotVoiceDataset, "zs_dataset");
    assert_serialization(IdCategory::ZeroShotVoiceEmbedding, "zs_voice");
    assert_serialization(IdCategory::ZeroShotTtsResult, "zs_tts_result");
    assert_serialization(IdCategory::ModelWeights, "model_weights");
    assert_serialization(IdCategory::FileUpload, "file_upload");
  }

    #[test]
    fn to_str() {
      assert_eq!(IdCategory::MediaFile.to_str(), "media_file");
      assert_eq!(IdCategory::LipsyncAnimationResult.to_str(), "lipsync_animation");
      assert_eq!(IdCategory::VideoFilterResult.to_str(), "video_filter");
      assert_eq!(IdCategory::TtsResult.to_str(), "tts_result");
      assert_eq!(IdCategory::VoiceConversionResult.to_str(), "voice_conversion");
      assert_eq!(IdCategory::ZeroShotVoiceDataset.to_str(), "zs_dataset");
      assert_eq!(IdCategory::ZeroShotVoiceEmbedding.to_str(), "zs_voice");
      assert_eq!(IdCategory::ZeroShotTtsResult.to_str(), "zs_tts_result");
      assert_eq!(IdCategory::ModelWeights.to_str(), "model_weights");
      assert_eq!(IdCategory::FileUpload.to_str(), "file_upload");
    }

    #[test]
    fn from_str() {
      assert_eq!(IdCategory::from_str("media_file").unwrap(), IdCategory::MediaFile);
      assert_eq!(IdCategory::from_str("lipsync_animation").unwrap(), IdCategory::LipsyncAnimationResult);
      assert_eq!(IdCategory::from_str("video_filter").unwrap(), IdCategory::VideoFilterResult);
      assert_eq!(IdCategory::from_str("tts_result").unwrap(), IdCategory::TtsResult);
      assert_eq!(IdCategory::from_str("voice_conversion").unwrap(), IdCategory::VoiceConversionResult);
      assert_eq!(IdCategory::from_str("zs_dataset").unwrap(), IdCategory::ZeroShotVoiceDataset);
      assert_eq!(IdCategory::from_str("zs_voice").unwrap(), IdCategory::ZeroShotVoiceEmbedding);
      assert_eq!(IdCategory::from_str("zs_tts_result").unwrap(), IdCategory::ZeroShotTtsResult);
      assert_eq!(IdCategory::from_str("model_weights").unwrap(), IdCategory::ModelWeights);
      assert_eq!(IdCategory::from_str("file_upload").unwrap(), IdCategory::FileUpload);
    }

    #[test]
    fn all_variants() {
      // Static check
      let mut variants = IdCategory::all_variants();
      assert_eq!(variants.len(), 10);
      assert_eq!(variants.pop_first(), Some(IdCategory::MediaFile));
      assert_eq!(variants.pop_first(), Some(IdCategory::LipsyncAnimationResult));
      assert_eq!(variants.pop_first(), Some(IdCategory::VideoFilterResult));
      assert_eq!(variants.pop_first(), Some(IdCategory::TtsResult));
      assert_eq!(variants.pop_first(), Some(IdCategory::VoiceConversionResult));
      assert_eq!(variants.pop_first(), Some(IdCategory::ZeroShotTtsResult));
      assert_eq!(variants.pop_first(), Some(IdCategory::ZeroShotVoiceDataset));
      assert_eq!(variants.pop_first(), Some(IdCategory::ZeroShotVoiceEmbedding));
      assert_eq!(variants.pop_first(), Some(IdCategory::ModelWeights));
      assert_eq!(variants.pop_first(), Some(IdCategory::FileUpload));
      assert_eq!(variants.pop_first(), None);

      // Generated check
      use strum::IntoEnumIterator;
      assert_eq!(IdCategory::all_variants().len(), IdCategory::iter().len());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(IdCategory::all_variants().len(), IdCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in IdCategory::all_variants() {
        assert_eq!(variant, IdCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, IdCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, IdCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
