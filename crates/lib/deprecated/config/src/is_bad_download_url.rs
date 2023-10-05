//! Probably should be in its own "static_config" crate.

use url::{Host, Url};

/// Reports if the URL is inappropriate for downloading as a TTS model, vocoder, etc.
pub fn is_bad_download_url(url: &str) -> anyhow::Result<bool> {

  if url.trim().is_empty() {
    // We can't use empty URLs.
    return Ok(true);
  }

  let url = Url::parse(url)?;

  match url.host() {
    Some(Host::Domain(domain)) => {
      let domain = domain.to_lowercase();

      // TODO: If this list grows, store it in a static hashset
      let bad_host = domain.contains("fb.watch")
          || domain.contains("tiktok.com")
          || domain.contains("vm.tiktok.com") // NB: This hostname is known for never disconnecting, which freezes the job
          || domain.contains("youtu.be")
          || domain.contains("youtube.com");

      if bad_host {
        return Ok(true)
      }
    }
    _ => {},
  }

  Ok(false)
}

#[cfg(test)]
mod tests {
  use crate::is_bad_download_url::is_bad_download_url;

  #[test]
  fn bad_download_url() {
    assert!(is_bad_download_url("").unwrap());
    assert!(is_bad_download_url("   ").unwrap());
    assert!(is_bad_download_url("https://vm.tiktok.com/ZMNYjT7Xy/?k=1 ").unwrap()); // NB: We get lots of these
    assert!(is_bad_download_url("https://m.youtube.com/watch?v=HY-vzGBiAZo").unwrap()); // NB: We get lots of these
  }

  #[test]
  fn good_tts_model_url() {
    assert!(!is_bad_download_url("https://drive.google.com/file/d/1-1kEoX4HGCwJm4R9cZhSVByWmUoQVGVm/view").unwrap());
    assert!(!is_bad_download_url("https://drive.google.com/file/d/1SofQhvSkDY-vi_zuBfHivBbJo4CqhJeH/view?usp=sharing").unwrap());
  }
}
