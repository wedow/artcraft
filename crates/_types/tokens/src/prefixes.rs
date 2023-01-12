// Supposedly there is no limit on number of enum variants, so this shouldn't be exhaustible.
// https://www.reddit.com/r/rust/comments/lf10lv/any_limit_on_enum_variants_amount/

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Each entity type in our system gets a unique prefix.
/// Older entities have prefixes ending in ':', but newer entities use the Stripe-style "_"
/// separator, which makes it easy to select and copy entire tokens with just mouse clicks across
/// all major operating systems.
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
#[cfg_attr(test, derive(EnumIter, EnumCount))]
pub(crate) enum EntityType {
  DownloadJob,
  InferenceJob,
  MediaUpload,
  User,
  VoiceConversionModel,
  Avt,
}

impl EntityType {

  pub fn prefix(self) -> &'static str {
    match self {
      Self::DownloadJob => "jdown_", // NB: Was "JGUP:"
      Self::InferenceJob => "jinf_",
      Self::MediaUpload => "mu_",
      Self::User => "U:", // NB: Old-style prefix.
      Self::VoiceConversionModel => "voco_",
      Self::Avt => "avt_",
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::prefixes::EntityType;
  use std::collections::HashSet;
  use strum::EnumCount;
  use strum::IntoEnumIterator;

  #[test]
  fn test_all_prefixes_are_unique() {
    let entities = EntityType::iter()
        .map(|entity| entity.prefix())
        .collect::<HashSet<&'static str>>();

    assert!(entities.len() > 0);
    assert_eq!(entities.len(), EntityType::COUNT);
  }

  #[test]
  fn test_all_prefixes_are_unique_regardless_of_case_and_suffix() {
    let entities = EntityType::iter()
        .map(|entity| entity.prefix())
        .map(|prefix| prefix.to_lowercase())
        .map(|prefix| prefix.replace("-", ""))
        .map(|prefix| prefix.replace(":", ""))
        .map(|prefix| prefix.replace("_", ""))
        .collect::<HashSet<String>>();

    assert!(entities.len() > 0);
    assert_eq!(entities.len(), EntityType::COUNT);
  }

  #[test]
  fn test_all_prefixes_end_with_separator() {
    assert!(EntityType::iter()
        .map(|entity| entity.prefix())
        .all(|prefix| prefix.ends_with(":") || prefix.ends_with("_")));
  }

  #[test]
  fn test_all_prefixes_end_with_separator_length_one() {
    for prefix in EntityType::iter().map(|entity| entity.prefix()) {
      assert_eq!(prefix.len() - 1, prefix.replace(":", "").replace("_", "").len());
    }
  }
}
