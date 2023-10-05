use std::collections::HashSet;

use crate::RESERVED_SUBSTRINGS;
use crate::RESERVED_USERNAMES;

pub fn is_reserved_username(username: &str) -> bool {
  lazy_static! {
    static ref RESERVED_USERNAMES_SET : HashSet<String> = RESERVED_USERNAMES.lines()
      .map(|line| line.trim())
      .filter(|line| !(line.starts_with('#') || line.is_empty()))
      .map(|line| line.to_string())
      .collect::<HashSet<String>>();
  }

  if RESERVED_USERNAMES_SET.contains(username) {
    return true;
  }

  is_reserved_substring(username)
}

fn is_reserved_substring(username: &str) -> bool {
  lazy_static! {
    static ref RESERVED_SUBSTRINGS_LIST : Vec<String> = RESERVED_SUBSTRINGS.lines()
      .map(|line| line.trim())
      .filter(|line| !(line.starts_with('#') || line.is_empty()))
      .map(|line| line.to_string())
      .collect::<Vec<String>>();
  }

  let undashed = username.replace(['_', '-'], "");

  for substr in RESERVED_SUBSTRINGS_LIST.iter() {
    if username.contains(substr) || undashed.contains(substr) {
      return true;
    }
  }

  false
}

#[cfg(test)]
mod tests {
  use crate::validations::is_reserved_username::is_reserved_username;

  #[test]
  fn reserved_usernames() {
    assert!(is_reserved_username("vocodes"));
    assert!(is_reserved_username("user"));
    assert!(is_reserved_username("username"));
    assert!(is_reserved_username("thread"));
  }

  #[test]
  fn unreserved_usernames() {
    assert!(!is_reserved_username("echelon"));
    assert!(!is_reserved_username("asdfasdfadsf"));
    assert!(!is_reserved_username("bobdole11"));
  }

  #[test]
  fn reserved_substrings() {
    assert!(is_reserved_username("test112345"));
    assert!(is_reserved_username("12345test"));
    assert!(is_reserved_username("test"));
    assert!(is_reserved_username("111vocodes111"));
    assert!(is_reserved_username("thefakeyousite"));
  }

  #[test]
  fn reserved_substrings_with_dashes() {
    assert!(is_reserved_username("t_e_s_t"));
    assert!(is_reserved_username("-vo-co-de-s--"));
    assert!(is_reserved_username("fake_you"));
  }
}