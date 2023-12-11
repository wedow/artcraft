//! Probably should be in its own "static_config" crate.

use crate::is_bad_download_url::is_bad_download_url;

/// Reports if the URL is inappropriate for downloading as a TTS model, vocoder, etc.
/// DEPRECATE:
pub fn is_bad_tts_model_download_url(url: &str) -> anyhow::Result<bool> {
  // TODO: Just use this.
  is_bad_download_url(url)
}

pub fn is_bad_model_weights_download_url(url: &str) -> anyhow::Result<bool> {
  is_bad_download_url(url)
}

#[cfg(test)]
mod tests {
  use crate::bad_urls::is_bad_tts_model_download_url;

  #[test]
  fn bad_tts_model_url() {
    assert_eq!(is_bad_tts_model_download_url("").unwrap(), true);
    assert_eq!(is_bad_tts_model_download_url("   ").unwrap(), true);
    assert_eq!(is_bad_tts_model_download_url("https://vm.tiktok.com/ZMNYjT7Xy/?k=1 ").unwrap(), true); // NB: We get lots of these
    assert_eq!(is_bad_tts_model_download_url("https://m.youtube.com/watch?v=HY-vzGBiAZo").unwrap(), true); // NB: We get lots of these
  }

  #[test]
  fn good_tts_model_url() {
    assert_eq!(is_bad_tts_model_download_url("https://drive.google.com/file/d/1-1kEoX4HGCwJm4R9cZhSVByWmUoQVGVm/view").unwrap(), false);
    assert_eq!(is_bad_tts_model_download_url("https://drive.google.com/file/d/1SofQhvSkDY-vi_zuBfHivBbJo4CqhJeH/view?usp=sharing").unwrap(), false);
  }
}