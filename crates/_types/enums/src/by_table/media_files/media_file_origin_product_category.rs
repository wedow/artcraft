use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in `VARCHAR(16)` field `origin_product_category`.
///
/// This value indicates what product originally created the media file. (Not the ML model or
/// user upload process.) This will let us scope media files to the product that generated them
/// and filter them out of unrelated products if necessary (eg. a user probably doesn't want
/// "Voice Designer" dataset samples in a video generation flow.)
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
pub enum MediaFileOriginProductCategory {
  /// Media files created by (or uploaded for) the Face Animator product.
  /// The underlying model could be SadTalker, Wav2Lip, or some future model
  #[serde(rename = "face_animator")]
  FaceAnimator,

  /// Text to speech (Tacotron2, not voice designer / VallE-X)
  #[serde(rename = "tts")]
  TextToSpeech,

  // TODO: This should be a temporary category until we migrate the DB to remove this default value
  /// Unknown which product is attached to the file (generated the file, the file was
  /// uploaded on behalf of, etc.)
  #[serde(rename = "unknown")]
  Unknown,

  /// Voice conversion (either RVC or SVC)
  #[serde(rename = "voice_conversion")]
  VoiceConversion,

  /// Media files created by (or uploaded for) the Zero Shot voice product.
  #[serde(rename = "zs_voice")]
  ZeroShotVoice,

  // Media files for video filters
  #[serde(rename = "video_filter")]
  VideoFilter,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileOriginProductCategory);
impl_mysql_enum_coders!(MediaFileOriginProductCategory);
impl_mysql_from_row!(MediaFileOriginProductCategory);

/// NB: Legacy API for older code.
impl MediaFileOriginProductCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::FaceAnimator => "face_animator",
      Self::TextToSpeech => "tts",
      Self::Unknown => "unknown",
      Self::VoiceConversion => "voice_conversion",
      Self::ZeroShotVoice => "zs_voice",
      Self::VideoFilter => "video_filter",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "face_animator" => Ok(Self::FaceAnimator),
      "tts" => Ok(Self::TextToSpeech),
      "unknown" => Ok(Self::Unknown),
      "voice_conversion" => Ok(Self::VoiceConversion),
      "zs_voice" => Ok(Self::ZeroShotVoice),
      "video_filter" => Ok(Self::VideoFilter),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::FaceAnimator,
      Self::TextToSpeech,
      Self::VideoFilter,
      Self::Unknown,
      Self::VoiceConversion,
      Self::ZeroShotVoice,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileOriginProductCategory::FaceAnimator, "face_animator");
      assert_serialization(MediaFileOriginProductCategory::TextToSpeech, "tts");
      assert_serialization(MediaFileOriginProductCategory::Unknown, "unknown");
      assert_serialization(MediaFileOriginProductCategory::VoiceConversion, "voice_conversion");
      assert_serialization(MediaFileOriginProductCategory::ZeroShotVoice, "zs_voice");
      assert_serialization(MediaFileOriginProductCategory::VideoFilter, "video_filter")
    }

    #[test]
    fn to_str() {
      assert_eq!(MediaFileOriginProductCategory::FaceAnimator.to_str(), "face_animator");
      assert_eq!(MediaFileOriginProductCategory::TextToSpeech.to_str(), "tts");
      assert_eq!(MediaFileOriginProductCategory::Unknown.to_str(), "unknown");
      assert_eq!(MediaFileOriginProductCategory::VoiceConversion.to_str(), "voice_conversion");
      assert_eq!(MediaFileOriginProductCategory::ZeroShotVoice.to_str(), "zs_voice");
      assert_eq!(MediaFileOriginProductCategory::VideoFilter.to_str(), "video_filter");
    }

    #[test]
    fn from_str() {
      assert_eq!(MediaFileOriginProductCategory::from_str("face_animator").unwrap(), MediaFileOriginProductCategory::FaceAnimator);
      assert_eq!(MediaFileOriginProductCategory::from_str("tts").unwrap(), MediaFileOriginProductCategory::TextToSpeech);
      assert_eq!(MediaFileOriginProductCategory::from_str("unknown").unwrap(), MediaFileOriginProductCategory::Unknown);
      assert_eq!(MediaFileOriginProductCategory::from_str("voice_conversion").unwrap(), MediaFileOriginProductCategory::VoiceConversion);
      assert_eq!(MediaFileOriginProductCategory::from_str("zs_voice").unwrap(), MediaFileOriginProductCategory::ZeroShotVoice);
      assert_eq!(MediaFileOriginProductCategory::from_str("video_filter").unwrap(), MediaFileOriginProductCategory::VideoFilter);
    }

    #[test]
    fn all_variants() {
      let mut variants = MediaFileOriginProductCategory::all_variants();
      assert_eq!(variants.len(), 6);
      assert_eq!(variants.pop_first(), Some(MediaFileOriginProductCategory::FaceAnimator));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginProductCategory::TextToSpeech));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginProductCategory::Unknown));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginProductCategory::VoiceConversion));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginProductCategory::ZeroShotVoice));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginProductCategory::VideoFilter));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(MediaFileOriginProductCategory::all_variants().len(), MediaFileOriginProductCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in MediaFileOriginProductCategory::all_variants() {
        assert_eq!(variant, MediaFileOriginProductCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileOriginProductCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileOriginProductCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
