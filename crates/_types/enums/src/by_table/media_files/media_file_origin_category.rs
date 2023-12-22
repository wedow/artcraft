use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum MediaFileOriginCategory {
  /// ML model inference output - uploaded models or zero shot.
  Inference,

  /// Processed results - (we don't have these systems yet, but eg. trim, transcode, etc).
  Processed,

  /// User uploaded files (from their filesystem)
  Upload,

  /// User uploaded files recorded directly from their device (browser, mobile), typically using device APIs.
  DeviceApi,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileOriginCategory);
impl_mysql_enum_coders!(MediaFileOriginCategory);
impl_mysql_from_row!(MediaFileOriginCategory);

/// NB: Legacy API for older code.
impl MediaFileOriginCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Inference => "inference",
      Self::Processed => "processed",
      Self::Upload => "upload",
      Self::DeviceApi => "device_api",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "inference" => Ok(Self::Inference),
      "processed" => Ok(Self::Processed),
      "upload" => Ok(Self::Upload),
      "device_api" => Ok(Self::DeviceApi),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Inference,
      Self::Processed,
      Self::Upload,
      Self::DeviceApi,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileOriginCategory::Inference, "inference");
      assert_serialization(MediaFileOriginCategory::Processed, "processed");
      assert_serialization(MediaFileOriginCategory::Upload, "upload");
      assert_serialization(MediaFileOriginCategory::DeviceApi, "device_api");
    }

    #[test]
    fn test_to_str() {
      assert_eq!(MediaFileOriginCategory::Inference.to_str(), "inference");
      assert_eq!(MediaFileOriginCategory::Processed.to_str(), "processed");
      assert_eq!(MediaFileOriginCategory::Upload.to_str(), "upload");
      assert_eq!(MediaFileOriginCategory::DeviceApi.to_str(), "device_api");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(MediaFileOriginCategory::from_str("inference").unwrap(), MediaFileOriginCategory::Inference);
      assert_eq!(MediaFileOriginCategory::from_str("processed").unwrap(), MediaFileOriginCategory::Processed);
      assert_eq!(MediaFileOriginCategory::from_str("upload").unwrap(), MediaFileOriginCategory::Upload);
      assert_eq!(MediaFileOriginCategory::from_str("device_api").unwrap(), MediaFileOriginCategory::DeviceApi);
      assert!(MediaFileOriginCategory::from_str("foo").is_err());
    }

    #[test]
    fn all_variants() {
      let mut variants = MediaFileOriginCategory::all_variants();
      assert_eq!(variants.len(), 4);
      assert_eq!(variants.pop_first(), Some(MediaFileOriginCategory::Inference));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginCategory::Processed));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginCategory::Upload));
      assert_eq!(variants.pop_first(), Some(MediaFileOriginCategory::DeviceApi));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(MediaFileOriginCategory::all_variants().len(), MediaFileOriginCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in MediaFileOriginCategory::all_variants() {
        assert_eq!(variant, MediaFileOriginCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileOriginCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileOriginCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
