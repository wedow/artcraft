//! Arguments for lipsync inferences

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LipsyncArgs {
  #[serde(rename = "a")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_audio_source: Option<LipsyncAnimationAudioSource>,

  #[serde(rename = "i")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_image_source: Option<LipsyncAnimationImageSource>,
}

/// Audio sources can be one of several:
///  - F: media_files (todo)
///  - U: media_uploads (legacy)
///  - T: tts_results (legacy)
///  - V: voice_conversion_results (legacy)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum LipsyncAnimationAudioSource {
  // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  /// Media File Token (media_files table)
  /// Serde cannot yet rename enum variants.
  F(String),

  // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  /// Media Upload Token (media_uploads table)
  /// Serde cannot yet rename enum variants.
  U(String),

  // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  /// TTS Result Token (tts_results table)
  /// Serde cannot yet rename enum variants.
  T(String),

  // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  /// Voice Conversion Result Token (voice_conversion_results table)
  /// Serde cannot yet rename enum variants.
  V(String),
}

// TODO: Hydrate to a public enum with easier to read names.
impl LipsyncAnimationAudioSource {
  pub fn media_file_token(token: &str) -> Self {
    LipsyncAnimationAudioSource::F(token.to_string())
  }
  pub fn media_upload_token(token: &str) -> Self {
    LipsyncAnimationAudioSource::U(token.to_string())
  }
  pub fn tts_result_token(token: &str) -> Self {
    LipsyncAnimationAudioSource::T(token.to_string())
  }
  pub fn voice_conversion_result_token(token: &str) -> Self {
    LipsyncAnimationAudioSource::V(token.to_string())
  }
}

/// Video sources can be one of several:
///  - F: media_files (todo)
///  - U: media_uploads (legacy)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum LipsyncAnimationImageSource {
  // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  /// Media File Token (media_files table)
  /// Serde cannot yet rename enum variants.
  F(String),

  // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  /// Media Upload Token (media_uploads table)
  /// Serde cannot yet rename enum variants.
  U(String),
}

impl LipsyncAnimationImageSource {
  pub fn media_file_token(token: &str) -> Self {
    LipsyncAnimationImageSource::F(token.to_string())
  }
  pub fn media_upload_token(token: &str) -> Self {
    LipsyncAnimationImageSource::U(token.to_string())
  }
}

#[cfg(test)]
mod tests {
  use crate::payloads::generic_inference_args::lipsync_payload::{LipsyncAnimationAudioSource, LipsyncAnimationImageSource, LipsyncArgs};

  #[test]
  fn test_media_file() {
    let args = LipsyncArgs {
      maybe_audio_source: Some(LipsyncAnimationAudioSource::media_file_token("audio_media_file")),
      maybe_image_source: Some(LipsyncAnimationImageSource::media_file_token("image_media_file")),
    };
    let json = serde_json::ser::to_string(&args).unwrap();
    assert_eq!(json, r#"{"a":{"F":"audio_media_file"},"i":{"F":"image_media_file"}}"#.to_string());
  }

  #[test]
  fn test_media_upload() {
    let args = LipsyncArgs {
      maybe_audio_source: Some(LipsyncAnimationAudioSource::media_upload_token("audio_media_upload")),
      maybe_image_source: Some(LipsyncAnimationImageSource::media_upload_token("image_media_upload")),
    };
    let json = serde_json::ser::to_string(&args).unwrap();
    assert_eq!(json, r#"{"a":{"U":"audio_media_upload"},"i":{"U":"image_media_upload"}}"#.to_string());
  }

  #[test]
  fn test_tts_result() {
    let args = LipsyncArgs {
      maybe_audio_source: Some(LipsyncAnimationAudioSource::tts_result_token("audio_tts_result")),
      maybe_image_source: Some(LipsyncAnimationImageSource::media_upload_token("image_media_upload")),
    };
    let json = serde_json::ser::to_string(&args).unwrap();
    assert_eq!(json, r#"{"a":{"T":"audio_tts_result"},"i":{"U":"image_media_upload"}}"#.to_string());
  }
  #[test]
  fn test_voice_conversion_result() {
    let args = LipsyncArgs {
      maybe_audio_source: Some(LipsyncAnimationAudioSource::voice_conversion_result_token("audio_voice_conversion_result")),
      maybe_image_source: Some(LipsyncAnimationImageSource::media_upload_token("image_media_upload")),
    };
    let json = serde_json::ser::to_string(&args).unwrap();
    assert_eq!(json, r#"{"a":{"V":"audio_voice_conversion_result"},"i":{"U":"image_media_upload"}}"#.to_string());
  }
}
