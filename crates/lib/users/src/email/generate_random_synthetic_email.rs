use rand::Rng;

const EMAIL_PREFIX : &str = "synthetic.email";
const EMAIL_DOMAIN : &str = "getartcraft.com";

pub fn generate_random_synthetic_email() -> String {
  let random_digit = rand::thread_rng().gen_range(u32::MIN..u32::MAX);
  format!("{}.{}@{}", EMAIL_PREFIX, random_digit, EMAIL_DOMAIN)
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;
  use crate::email::generate_random_synthetic_email::generate_random_synthetic_email;

  #[test]
  fn test_base_case_success() {
    assert!(generate_random_synthetic_email().len() > 0);
  }

  #[test]
  fn generate_lots() {
    let mut collection = HashSet::new();
    for _ in 0..100 {
      collection.insert(generate_random_synthetic_email());
    }
    assert!(collection.len() > 50); // NB: Should be an easy bar to hit
  }

  #[test]
  fn test_email_format() {
    let email = generate_random_synthetic_email();
    assert!(email.contains("@"));
    assert!(email.contains("."));
  }
}