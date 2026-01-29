use crate::username::constants::USERNAME_MAX_LENGTH;
use collections::random_from_array::random_from_array;
use once_cell::sync::Lazy;
use primitives::iterators::iterate_trimmed_lines_without_comments::iterate_trimmed_lines_without_comments;
use primitives::str::first_letter_uppercase::first_letter_uppercase;
use rand::distr::{Distribution, StandardUniform};
use rand::Rng;
use std::collections::HashSet;

pub const ADJECTIVES : &str = include_str!("../../../../../includes/binary_includes/usernames/atoms/username_adjectives.txt");
pub const NOUNS : &str = include_str!("../../../../../includes/binary_includes/usernames/atoms/username_nouns.txt");
pub const NOUNS_ANIMALS: &str = include_str!("../../../../../includes/binary_includes/usernames/atoms/username_nouns_animals.txt");

static ALL_NOUNS : Lazy<Vec<&'static str>> = Lazy::new(|| {
  iterate_trimmed_lines_without_comments(NOUNS.lines())
      .chain(iterate_trimmed_lines_without_comments(NOUNS_ANIMALS.lines()))
      .collect::<HashSet<&'static str>>()
      .into_iter()
      .collect()
});

static ALL_ADJECTIVES : Lazy<Vec<&'static str>> = Lazy::new(|| {
  iterate_trimmed_lines_without_comments(ADJECTIVES.lines())
      .collect::<HashSet<&'static str>>()
      .into_iter()
      .collect::<Vec<&'static str>>()
});

/// Generate a random username for onboarding purposes.
/// This function is infallible and will always return a possible username.
pub fn generate_random_username() -> String {
  for _ in 0..100 {
    if let Some(username) = generate_candidate_username() {
      if username.len() > USERNAME_MAX_LENGTH {
        continue;
      }
      return username;
    }
  }

  "random_username".to_string()
}

enum UsernameFormat {
  CamelCase,
  KebabCase,
  SnakeCase,
  CamelKebabCase,
  CamelSnakeCase,
  ScreamingSnakeCase,
}

impl Distribution<UsernameFormat> for StandardUniform {
  fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> UsernameFormat {
    match rng.gen_range(0..=5) {
      0 => UsernameFormat::CamelCase,
      1 => UsernameFormat::KebabCase,
      2 => UsernameFormat::SnakeCase,
      3 => UsernameFormat::CamelKebabCase,
      4 => UsernameFormat::CamelSnakeCase,
      _ => UsernameFormat::ScreamingSnakeCase,
    }
  }
}
fn generate_candidate_username() -> Option<String> {
  let adjective = random_from_array(&ALL_ADJECTIVES)?;
  let noun = random_from_array(&ALL_NOUNS)?;

  let format : UsernameFormat = rand::random();
  let mut candidate_username = match format {
    UsernameFormat::CamelCase => format!("{}{}", first_letter_uppercase(adjective), first_letter_uppercase(noun)),
    UsernameFormat::KebabCase => format!("{}-{}", adjective, noun),
    UsernameFormat::SnakeCase => format!("{}_{}", adjective, noun),
    UsernameFormat::CamelKebabCase => format!("{}-{}", first_letter_uppercase(adjective), first_letter_uppercase(noun)),
    UsernameFormat::CamelSnakeCase => format!("{}_{}", first_letter_uppercase(adjective), first_letter_uppercase(noun)),
    UsernameFormat::ScreamingSnakeCase => format!("{}_{}", adjective.to_uppercase(), noun.to_uppercase()),
  };

  if let Some(digit) = maybe_random_safe_digit() {
    candidate_username = match format {
      UsernameFormat::CamelCase => format!("{}{}", candidate_username, digit),
      UsernameFormat::KebabCase
      | UsernameFormat::CamelKebabCase => format!("{}-{}", candidate_username, digit),
      UsernameFormat::SnakeCase
      | UsernameFormat::CamelSnakeCase
      | UsernameFormat::ScreamingSnakeCase => format!("{}_{}", candidate_username, digit),
    };
  }

  Some(candidate_username)
}

fn maybe_random_safe_digit() -> Option<u32> {
  fn maybe_random_digit() -> Option<u32> {
    // Give uniform probability for the number of digits
    let num_digits = rand::thread_rng().gen_range(0..5u8);
    match num_digits {
      0 => None,
      1 => Some(rand::thread_rng().gen_range(0..10)),
      2 => Some(rand::thread_rng().gen_range(10..100)),
      3 => Some(rand::thread_rng().gen_range(100..1000)),
      4 => Some(rand::thread_rng().gen_range(1000..10000)),
      _ => Some(rand::thread_rng().gen_range(10000..100000)),
    }
  }

  // Don't return potentially offensive numbers
  match maybe_random_digit() {
    None => None,
    Some(69) => None,
    Some(420) => None,
    Some(666) => None,
    Some(8008) => None,
    Some(80085) => None,
    Some(8008135) => None,
    Some(digit) => Some(digit),
  }
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;
  use crate::username::generate_random_username::generate_random_username;

  #[test]
  fn test_base_case_success() {
    assert!(generate_random_username().len() > 0);
  }

  #[test]
  fn generate_lots() {
    let mut collection = HashSet::new();
    for _ in 0..100 {
      collection.insert(generate_random_username());
    }
    assert!(collection.len() > 50); // NB: Should be an easy bar to hit
  }
}
