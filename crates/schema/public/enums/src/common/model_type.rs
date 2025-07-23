use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 24 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ModelType {
  Artcraft,
  Fal,
  Sora,
}

impl_enum_display_and_debug_using_to_str!(ModelType);
impl_mysql_enum_coders!(ModelType);
impl_mysql_from_row!(ModelType);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl ModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::Fal => "fal",
      Self::Sora => "sora",
    }
  }

  pub fn from_str(job_status: &str) -> Result<Self, String> {
    match job_status {
      "artcraft" => Ok(Self::Artcraft),
      "fal" => Ok(Self::Fal),
      "sora" => Ok(Self::Sora),
      _ => Err(format!("invalid task_state: {:?}", job_status)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Artcraft,
      Self::Fal,
      Self::Sora,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::model_type::ModelType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ModelType::Artcraft, "artcraft");
      assert_serialization(ModelType::Fal, "fal");
      assert_serialization(ModelType::Sora, "sora");
    }

    #[test]
    fn to_str() {
      assert_eq!(ModelType::Artcraft.to_str(), "artcraft");
      assert_eq!(ModelType::Fal.to_str(), "fal");
      assert_eq!(ModelType::Sora.to_str(), "sora");
    }

    #[test]
    fn from_str() {
      assert_eq!(ModelType::from_str("artcraft").unwrap(), ModelType::Artcraft);
      assert_eq!(ModelType::from_str("fal").unwrap(), ModelType::Fal);
      assert_eq!(ModelType::from_str("sora").unwrap(), ModelType::Sora);
    }

    #[test]
    fn all_variants() {
      let mut variants = ModelType::all_variants();
      assert_eq!(variants.len(), 3);
      assert_eq!(variants.pop_first(), Some(ModelType::Artcraft));
      assert_eq!(variants.pop_first(), Some(ModelType::Fal));
      assert_eq!(variants.pop_first(), Some(ModelType::Sora));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(ModelType::all_variants().len(), ModelType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in ModelType::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, ModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, ModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, ModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 24;
      for variant in ModelType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
