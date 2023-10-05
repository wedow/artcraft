use std::collections::HashSet;

use once_cell::sync::Lazy;

use crate::BANNED_SLURS;
use crate::latin_alphabet::latin_to_ascii;

static BANNED_SLURS_SET : Lazy<HashSet<String>> = Lazy::new(|| {
  BANNED_SLURS.lines()
      .map(|line| line.trim())
      .filter(|line| !(line.starts_with('#') || line.is_empty()))
      .map(|line| line.to_string())
      .collect::<HashSet<String>>()
});

pub fn contains_slurs(unparsed_text: &str) -> bool {
  let simplified = latin_to_ascii(unparsed_text).to_lowercase();
  for wordlike in simplified.split_ascii_whitespace() {
    if BANNED_SLURS_SET.contains(wordlike) {
      return true;
    }
  }
  false
}

#[cfg(test)]
mod tests {
  use crate::check_for_slurs::contains_slurs;

  #[test]
  fn valid_text_passes() {
    assert!(!contains_slurs(""));
    assert!(!contains_slurs("this is a test."));
    assert!(!contains_slurs("this\nis\na\ntest\n\n"));
    assert!(!contains_slurs("    this    is    a       test"));
  }

  #[test]
  fn text_with_slurs_fails() {
    assert!(contains_slurs("a sentence containing fag is banned"));
    assert!(contains_slurs("a\nsentence\ncontaining fags\nis banned"));
  }

  #[test]
  fn text_with_mixed_case_slurs_fails() {
    assert!(contains_slurs("FAG"));
    assert!(contains_slurs("FaG"));
    assert!(contains_slurs("fAg"));
    assert!(contains_slurs("A SENTENCE CONTAINING FAG IS BANNED"));
    assert!(contains_slurs("a\nsentence\ncontaining FAGS\nis banned"));
  }

  #[test]
  fn text_with_latin_obfuscated_slurs_fails() {
    assert!(contains_slurs("FÀG"));
    assert!(contains_slurs("FÁG"));
    assert!(contains_slurs("FÂG"));
    assert!(contains_slurs("FÃG"));
    assert!(contains_slurs("FÄG"));
    assert!(contains_slurs("FÅG"));

    assert!(contains_slurs("fàg"));
    assert!(contains_slurs("fág"));
    assert!(contains_slurs("fâg"));
    assert!(contains_slurs("fãg"));
    assert!(contains_slurs("fäg"));
    assert!(contains_slurs("fåg"));
  }
}
