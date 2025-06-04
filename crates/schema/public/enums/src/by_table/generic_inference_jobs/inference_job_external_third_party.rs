use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `generic_inference_jobs` table in `VARCHAR(16)` field `maybe_external_third_party`.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum InferenceJobExternalThirdParty {
  /// Fal jobs
  #[serde(rename = "fal")]
  #[default]
  Fal,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceJobExternalThirdParty);
impl_mysql_enum_coders!(InferenceJobExternalThirdParty);

/// NB: Legacy API for older code.
impl InferenceJobExternalThirdParty {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Fal => "fal",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "fal" => Ok(Self::Fal),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Fal,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(InferenceJobExternalThirdParty::Fal, "fal");
    }

    #[test]
    fn to_str() {
      assert_eq!(InferenceJobExternalThirdParty::Fal.to_str(), "fal");
    }

    #[test]
    fn from_str() {
      assert_eq!(InferenceJobExternalThirdParty::from_str("fal").unwrap(), InferenceJobExternalThirdParty::Fal);
    }

    #[test]
    fn all_variants() {
      // Static check
      const EXPECTED_COUNT : usize = 1;
      
      assert_eq!(InferenceJobExternalThirdParty::all_variants().len(), EXPECTED_COUNT);
      assert_eq!(InferenceJobExternalThirdParty::iter().len(), EXPECTED_COUNT);

      // Generated check
      use strum::IntoEnumIterator;
      assert_eq!(InferenceJobExternalThirdParty::all_variants().len(), InferenceJobExternalThirdParty::iter().len());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(InferenceJobExternalThirdParty::all_variants().len(), InferenceJobExternalThirdParty::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in InferenceJobExternalThirdParty::all_variants() {
        assert_eq!(variant, InferenceJobExternalThirdParty::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, InferenceJobExternalThirdParty::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, InferenceJobExternalThirdParty::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 32;
      for variant in InferenceJobExternalThirdParty::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
