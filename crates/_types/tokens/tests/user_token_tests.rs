/// Test UserToken in isolation, just in case our macro-derived tests break.

use serde::Deserialize;
use serde::Serialize;

use tokens::users::user::UserToken;

#[derive(Serialize, Deserialize, PartialEq, Debug)]
struct CompositeType {
  user_token: UserToken,
  string: String,
}

mod interface {
  use tokens::users::user::UserToken;

  #[test]
  fn generate() {
    let token = UserToken::generate();
    assert!(!token.to_string().is_empty());
    assert!(token.to_string().starts_with("U:"));
  }

  #[test]
  fn new() {
    let token = UserToken::new("U:foo".to_string());
    assert_eq!(token, UserToken("U:foo".to_string()));
  }

  #[test]
  fn new_from_str() {
    let token = UserToken::new_from_str("U:foo");
    assert_eq!(token, UserToken("U:foo".to_string()));
  }

  #[test]
  fn as_str() {
    let token = UserToken("U:foo".to_string());
    assert_eq!(token.as_str(), "U:foo");
  }

  #[test]
  fn to_string() {
    let token = UserToken("U:foo".to_string());
    assert_eq!(token.to_string(), "U:foo".to_string());
  }
}

mod traits {
  use tokens::users::user::UserToken;

  #[test]
  fn display() {
    let token = UserToken("U:foo".to_string());
    assert_eq!(format!("{}", token), "U:foo".to_string());
  }

  #[test]
  fn debug() {
    let token = UserToken("U:foo".to_string());
    assert_eq!(format!("{:?}", token), "UserToken(\"U:foo\")".to_string());
  }
}

mod serialization {
  use tokens::users::user::UserToken;

  use crate::CompositeType;

  #[test]
  fn serialize() {
    let expected = "\"U:foo\"".to_string(); // NB: Quoted

    let token = UserToken("U:foo".to_string());
    assert_eq!(expected, toml::to_string(&token).unwrap());

    // Just to show this serializes the same as a string
    assert_eq!(expected, toml::to_string("U:foo").unwrap());
  }

  #[test]
  fn nested_serialize() {
    let value = CompositeType { user_token: UserToken("U:foo".to_string()), string: "bar".to_string() };
    let expected = r#"{"user_token":"U:foo","string":"bar"}"#.to_string();
    assert_eq!(expected, serde_json::to_string(&value).unwrap());
  }
}

mod deserialization {
  use tokens::users::user::UserToken;

  use crate::CompositeType;

  #[test]
  fn deserialize() {
    let payload = "\"U:foo\""; // NB: Quoted
    let expected = "U:foo".to_string();

    let value: UserToken = serde_json::from_str(payload).unwrap();
    assert_eq!(value, UserToken(expected.clone()));

    // Just to show this deserializes the same way as a string
    let value: String = serde_json::from_str(payload).unwrap();
    assert_eq!(value, expected.clone());
  }

  #[test]
  fn nested_deserialize() {
    let payload = r#"{"user_token":"U:foo","string":"bar"}"#.to_string();
    let expected = CompositeType {
      user_token: UserToken("U:foo".to_string()),
      string: "bar".to_string(),
    };

    assert_eq!(expected, serde_json::from_str::<CompositeType>(&payload).unwrap());
  }
}

// These traits should be tested by the macro, but we duplicate them in case that breaks
mod crockford_traits {
  use tokens::users::user::UserToken;

  const ENTROPIC_CHARACTERS_MINIMUM : usize = 8;

  #[test]
  fn entropy_is_sufficient() {
    assert!(UserToken::entropic_character_len() > ENTROPIC_CHARACTERS_MINIMUM);
  }

  #[test]
  fn token_length() {
    assert_eq!(UserToken::generate().as_str().len(), 15);
  }

  #[test]
  fn tokens_are_random() {
    let mut tokens = std::collections::HashSet::new();
    for _ in 0..100 {
      tokens.insert(UserToken::generate().to_string());
    }
    assert_eq!(tokens.len(), 100);
  }

  #[test]
  fn character_set() {
    let token_string = UserToken::generate().to_string();
    let prefix = UserToken::token_prefix();
    let random_part = token_string.replace(prefix, "");

    assert!(random_part.len() > ENTROPIC_CHARACTERS_MINIMUM);
    assert!(random_part.chars().all(|c| c.is_numeric() || c.is_uppercase()));
  }

  #[test]
  fn prefix_ends_with_separator() {
    let prefix = UserToken::token_prefix();
    assert!(prefix.ends_with(':') || prefix.ends_with('_'));

    let token_string = UserToken::generate().to_string();
    assert!(token_string.contains(':') || token_string.contains('_'));
  }

  #[test]
  fn token_begins_with_prefix() {
    let prefix = UserToken::token_prefix();
    let token_string = UserToken::generate().to_string();
    assert!(token_string.starts_with(prefix));
  }

  #[test]
  fn entropy_suffix() {
    let token = UserToken::new_from_str("U:foo");
    assert_eq!(token.entropy_suffix(), "foo");

    let token = UserToken::new_from_str("bar");
    assert_eq!(token.entropy_suffix(), "bar");

    let token = UserToken::generate();
    assert_eq!(token.entropy_suffix().len(), 13);
  }
}
