use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `prompt_context_items` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PromptContextSemanticType {
  /// Image-to-Video starting frame
  VidStartFrame,

  /// Image-to-Video ending frame
  VidEndFrame,

  /// Standard image reference without a semantic type (e.g. Sora/ChatGPT 4o/gpt-image-1)
  Imgref,

  ImgrefCharacter,
  ImgrefStyle,
  ImgrefBg,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(PromptContextSemanticType);
impl_mysql_enum_coders!(PromptContextSemanticType);
impl_mysql_from_row!(PromptContextSemanticType);

/// NB: Legacy API for older code.
impl PromptContextSemanticType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::VidStartFrame => "vid_start_frame",
      Self::VidEndFrame => "vid_end_frame",
      Self::Imgref => "imgref",
      Self::ImgrefCharacter => "imgref_character",
      Self::ImgrefStyle => "imgref_style",
      Self::ImgrefBg => "imgref_bg",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "vid_start_frame" => Ok(Self::VidStartFrame),
      "vid_end_frame" => Ok(Self::VidEndFrame),
      "imgref" => Ok(Self::Imgref),
      "imgref_character" => Ok(Self::ImgrefCharacter),
      "imgref_style" => Ok(Self::ImgrefStyle),
      "imgref_bg" => Ok(Self::ImgrefBg),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::VidStartFrame,
      Self::VidEndFrame,
      Self::Imgref,
      Self::ImgrefCharacter,
      Self::ImgrefStyle,
      Self::ImgrefBg,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PromptContextSemanticType::VidStartFrame, "vid_start_frame");
      assert_serialization(PromptContextSemanticType::VidEndFrame, "vid_end_frame");
      assert_serialization(PromptContextSemanticType::Imgref, "imgref");
      assert_serialization(PromptContextSemanticType::ImgrefCharacter, "imgref_character");
      assert_serialization(PromptContextSemanticType::ImgrefStyle, "imgref_style");
      assert_serialization(PromptContextSemanticType::ImgrefBg, "imgref_bg");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(PromptContextSemanticType::VidStartFrame.to_str(), "vid_start_frame");
      assert_eq!(PromptContextSemanticType::VidEndFrame.to_str(), "vid_end_frame");
      assert_eq!(PromptContextSemanticType::Imgref.to_str(), "imgref");
      assert_eq!(PromptContextSemanticType::ImgrefCharacter.to_str(), "imgref_character");
      assert_eq!(PromptContextSemanticType::ImgrefStyle.to_str(), "imgref_style");
      assert_eq!(PromptContextSemanticType::ImgrefBg.to_str(), "imgref_bg");
    }

    #[test]
    fn from_str() {
      assert_eq!(PromptContextSemanticType::from_str("vid_start_frame").unwrap(), PromptContextSemanticType::VidStartFrame);
      assert_eq!(PromptContextSemanticType::from_str("vid_end_frame").unwrap(), PromptContextSemanticType::VidEndFrame);
      assert_eq!(PromptContextSemanticType::from_str("imgref").unwrap(), PromptContextSemanticType::Imgref);
      assert_eq!(PromptContextSemanticType::from_str("imgref_character").unwrap(), PromptContextSemanticType::ImgrefCharacter);
      assert_eq!(PromptContextSemanticType::from_str("imgref_style").unwrap(), PromptContextSemanticType::ImgrefStyle);
      assert_eq!(PromptContextSemanticType::from_str("imgref_bg").unwrap(), PromptContextSemanticType::ImgrefBg);
      assert!(PromptContextSemanticType::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = PromptContextSemanticType::all_variants();
      assert_eq!(variants.len(), 6);
      assert_eq!(variants.pop_first(), Some(PromptContextSemanticType::VidStartFrame));
      assert_eq!(variants.pop_first(), Some(PromptContextSemanticType::VidEndFrame));
      assert_eq!(variants.pop_first(), Some(PromptContextSemanticType::Imgref));
      assert_eq!(variants.pop_first(), Some(PromptContextSemanticType::ImgrefCharacter));
      assert_eq!(variants.pop_first(), Some(PromptContextSemanticType::ImgrefStyle));
      assert_eq!(variants.pop_first(), Some(PromptContextSemanticType::ImgrefBg));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(PromptContextSemanticType::all_variants().len(), PromptContextSemanticType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in PromptContextSemanticType::all_variants() {
        assert_eq!(variant, PromptContextSemanticType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, PromptContextSemanticType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, PromptContextSemanticType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in PromptContextSemanticType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
