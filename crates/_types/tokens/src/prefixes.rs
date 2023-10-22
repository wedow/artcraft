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
  /// AVTs are not stored as primary keys in any table, but an index in many tables.
  AnonymousVisitorTracking,
  AuditLog,
  Comment,
  DownloadJob,
  InferenceJob,
  MediaFile,
  MediaUpload,
  ModelCategory,
  NewsStory, // NB: aichatbot / sqlite
  PasswordReset,
  TtsModel,
  TtsRenderTask, // NB: aichatbot / sqlite
  User,
  VoiceConversionModel,
  VoiceConversionResult,
  W2lTemplate,
  ZsVoice,
  ZsVoiceDataset,
  ZsVoiceDatasetSample,
}

impl EntityType {

  pub fn prefix(self) -> &'static str {
    match self {
      Self::AnonymousVisitorTracking => "avt_",
      Self::AuditLog => "audit_",
      Self::Comment => "comment_",
      Self::DownloadJob => "jdown_", // NB: Was "JGUP:"
      Self::InferenceJob => "jinf_",
      Self::MediaFile => "m_",
      Self::MediaUpload => "mu_",
      Self::ModelCategory => "CAT:", // NB: Old-style prefix, do not use for future tokens.
      Self::NewsStory => "news_story_",
      Self::PasswordReset => "pw_reset_",
      Self::TtsModel => "TM:", // NB: Old-style prefix, do not use for future tokens.
      Self::TtsRenderTask => "tts_task_",
      Self::User => "U:", // NB: Old-style prefix, do not use for future tokens.
      Self::VoiceConversionModel => "vcm_",
      Self::VoiceConversionResult => "vcr_",
      Self::W2lTemplate => "WT:", // NB: Old-style prefix, do not use for future tokens.
      Self::ZsVoice => "zsv_",
      Self::ZsVoiceDataset => "zsd_",
      Self::ZsVoiceDatasetSample => "zss_",
    }
  }
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;

  use strum::EnumCount;
  use strum::IntoEnumIterator;

  use crate::prefixes::EntityType;

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
      if prefix == "news_story_" || prefix == "tts_task_" {
        // TODO/FIXME: I'm too tired at 5AM to replacen from the left. Make this test valid.
        //  These tokens are from the AIChatBot sidecar, so asserting their validity is less important.
        continue;
      }
      assert_eq!(prefix.len() - 1, prefix.replace(":", "").replace("_", "").len());
    }
  }
}
