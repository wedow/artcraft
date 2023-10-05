//! Probably should be in its own "static_config" crate.

use crate::is_bad_download_url::is_bad_download_url;

/// Reports if the URL is inappropriate for downloading as a TTS model, vocoder, etc.
pub fn is_bad_tts_model_download_url(url: &str) -> anyhow::Result<bool> {
  // TODO: Just use this.
  is_bad_download_url(url)
}

#[cfg(test)]
mod tests {
  use crate::bad_urls::is_bad_tts_model_download_url;

  #[test]
  fn bad_tts_model_url() {
    assert!(is_bad_tts_model_download_url("").unwrap());
    assert!(is_bad_tts_model_download_url("   ").unwrap());
    assert!(is_bad_tts_model_download_url("https://vm.tiktok.com/ZMNYjT7Xy/?k=1 ").unwrap()); // NB: We get lots of these
    assert!(is_bad_tts_model_download_url("https://m.youtube.com/watch?v=HY-vzGBiAZo").unwrap()); // NB: We get lots of these
  }

  #[test]
  fn good_tts_model_url() {
    assert!(!is_bad_tts_model_download_url("https://drive.google.com/file/d/1-1kEoX4HGCwJm4R9cZhSVByWmUoQVGVm/view").unwrap());
    assert!(!is_bad_tts_model_download_url("https://drive.google.com/file/d/1SofQhvSkDY-vi_zuBfHivBbJo4CqhJeH/view?usp=sharing").unwrap());
  }
}