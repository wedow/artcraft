use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum SubscriptionNamespace {
  #[serde(rename = "artcraft")]
  Artcraft,
  #[serde(rename = "fakeyou")]
  FakeYou,
}

impl_enum_display_and_debug_using_to_str!(SubscriptionNamespace);
impl_mysql_enum_coders!(SubscriptionNamespace);
impl_mysql_from_row!(SubscriptionNamespace);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl SubscriptionNamespace {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::FakeYou => "fakeyou",
    }
  }

  pub fn from_str(s: &str) -> Result<Self, String> {
    match s {
      "artcraft" => Ok(Self::Artcraft),
      "fakeyou" => Ok(Self::FakeYou),
      _ => Err(format!("invalid subscription_namespace: {:?}", s)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Artcraft,
      Self::FakeYou,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::test_helpers::assert_serialization;
  use crate::common::subscription_namespace::SubscriptionNamespace;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(SubscriptionNamespace::Artcraft, "artcraft");
      assert_serialization(SubscriptionNamespace::FakeYou, "fakeyou");
    }

    #[test]
    fn to_str() {
      assert_eq!(SubscriptionNamespace::Artcraft.to_str(), "artcraft");
      assert_eq!(SubscriptionNamespace::FakeYou.to_str(), "fakeyou");
    }

    #[test]
    fn from_str() {
      assert_eq!(SubscriptionNamespace::from_str("artcraft").unwrap(), SubscriptionNamespace::Artcraft);
      assert_eq!(SubscriptionNamespace::from_str("fakeyou").unwrap(), SubscriptionNamespace::FakeYou);
    }

    #[test]
    fn all_variants() {
      let mut variants = SubscriptionNamespace::all_variants();
      assert_eq!(variants.len(), 2);
      assert_eq!(variants.pop_first(), Some(SubscriptionNamespace::Artcraft));
      assert_eq!(variants.pop_first(), Some(SubscriptionNamespace::FakeYou));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(SubscriptionNamespace::all_variants().len(), SubscriptionNamespace::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in SubscriptionNamespace::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, SubscriptionNamespace::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, SubscriptionNamespace::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, SubscriptionNamespace::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in SubscriptionNamespace::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
