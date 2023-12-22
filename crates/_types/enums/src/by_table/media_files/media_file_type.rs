use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum MediaFileType {
  /// Audio files: wav, mp3, etc.
  Audio,

  /// Image files: png, jpeg, etc.
  Image,

  /// Video files: mp4, etc.
  Video,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileType);
impl_mysql_enum_coders!(MediaFileType);
impl_mysql_from_row!(MediaFileType);

/// NB: Legacy API for older code.
impl MediaFileType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Audio => "audio",
      Self::Image => "image",
      Self::Video => "video",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "audio" => Ok(Self::Audio),
      "image" => Ok(Self::Image),
      "video" => Ok(Self::Video),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Audio,
      Self::Image,
      Self::Video,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::media_files::media_file_type::MediaFileType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileType::Audio, "audio");
      assert_serialization(MediaFileType::Image, "image");
      assert_serialization(MediaFileType::Video, "video");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(MediaFileType::Audio.to_str(), "audio");
      assert_eq!(MediaFileType::Image.to_str(), "image");
      assert_eq!(MediaFileType::Video.to_str(), "video");
    }

    #[test]
    fn from_str() {
      assert_eq!(MediaFileType::from_str("audio").unwrap(), MediaFileType::Audio);
      assert_eq!(MediaFileType::from_str("image").unwrap(), MediaFileType::Image);
      assert_eq!(MediaFileType::from_str("video").unwrap(), MediaFileType::Video);
      assert!(MediaFileType::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = MediaFileType::all_variants();
      assert_eq!(variants.len(), 3);
      assert_eq!(variants.pop_first(), Some(MediaFileType::Audio));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Image));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Video));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(MediaFileType::all_variants().len(), MediaFileType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in MediaFileType::all_variants() {
        assert_eq!(variant, MediaFileType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
