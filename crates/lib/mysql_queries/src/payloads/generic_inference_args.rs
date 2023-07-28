use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use errors::AnyhowResult;

/// Used to encode extra state for the `generic_inference_jobs` table.
/// This should act somewhat like a serialized protobuf stored inside a record.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GenericInferenceArgs {
  /// The category of inference (probably also present in a top-level field)
  #[serde(rename = "cat")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to consume fewer bytes
  #[serde(alias = "inference_category")]
  pub inference_category: Option<InferenceCategoryAbbreviated>,

  /// REQUIRED.
  /// Actual type-specific arguments.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub args: Option<PolymorphicInferenceArgs>,
}

/// Same as `InferenceCategory`, but serialized in fewer characters
/// Do not change the values.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum InferenceCategoryAbbreviated {
  #[serde(rename = "la")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "lipsync_animation")]
  LipsyncAnimation,

  #[serde(rename = "tts")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "text_to_speech")]
  TextToSpeech,

  #[serde(rename = "vc")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "voice_conversion")]
  VoiceConversion,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub enum FundamentalFrequencyMethodForJob {
  #[serde(rename = "c")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  Crepe,
  #[serde(rename = "d")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  Dio,
  #[serde(rename = "h")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  Harvest,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum PolymorphicInferenceArgs {
  /// Lipsync Animation (Short name to save  space when serializing)
  /// This is SadTalker, not Wav2Lip.
  La {
    #[serde(rename = "a")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
    #[serde(skip_serializing_if = "Option::is_none")]
    maybe_audio_media_upload_token: Option<String>,

    #[serde(rename = "i")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
    #[serde(skip_serializing_if = "Option::is_none")]
    maybe_image_media_upload_token: Option<String>,
  },
  /// Text to speech. (Short name to save space when serializing.)
  Tts {
    // No arguments yet.
    // It might be best to just not include this when not used.
  },
  /// Voice conversion. (Short name to save space when serializing.)
  Vc {
    /// Argument for so-vits-svc
    /// The python model defaults to true, but that sounds awful,
    /// so we default to false unless specified.
    #[serde(rename = "a")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
    #[serde(skip_serializing_if = "Option::is_none")]
    auto_predict_f0: Option<bool>,

    /// Argument for so-vits-svc (-fm / --f0-method)
    /// Crepe, dio, harvest, etc.
    /// If unspecified, the model defaults to crepe
    #[serde(rename = "fm")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
    #[serde(skip_serializing_if = "Option::is_none")]
    override_f0_method: Option<FundamentalFrequencyMethodForJob>,

    /// Argument for so-vits-svc (-t / --transpose)
    /// Pitch control.
    /// If unspecified, the model uses "0".
    #[serde(rename = "t")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
    #[serde(skip_serializing_if = "Option::is_none")]
    transpose: Option<i32>,
  },
}

impl GenericInferenceArgs {

  pub fn from_json(json: &str) -> AnyhowResult<Self> {
    Ok(serde_json::from_str(json)?)
  }

  pub fn to_json(&self) -> AnyhowResult<String> {
    Ok(serde_json::to_string(self)?)
  }
}

impl InferenceCategoryAbbreviated {
  pub fn from_inference_category(category: InferenceCategory) -> Self {
    match category {
      InferenceCategory::LipsyncAnimation => Self::LipsyncAnimation,
      InferenceCategory::TextToSpeech => Self::TextToSpeech,
      InferenceCategory::VoiceConversion => Self::VoiceConversion,
    }
  }

  pub fn to_inference_category(self) -> InferenceCategory {
    match self {
      Self::LipsyncAnimation => InferenceCategory::LipsyncAnimation,
      Self::TextToSpeech => InferenceCategory::TextToSpeech,
      Self::VoiceConversion => InferenceCategory::VoiceConversion,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::payloads::generic_inference_args::{FundamentalFrequencyMethodForJob, GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};

  #[test]
  fn typical_lipsync_animation_args_serialize() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::LipsyncAnimation),
      args: Some(PolymorphicInferenceArgs::La {
        maybe_audio_media_upload_token: Some("foo".to_string()),
        maybe_image_media_upload_token: Some("bar".to_string()),
      }),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json, r#"{"cat":"la","args":{"La":{"a":"foo","i":"bar"}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn typical_tts_args_serialize() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Tts {
      }),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json, r#"{"cat":"vc","args":{"Tts":{}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn typical_voice_conversion_args_serialize() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Vc {
        auto_predict_f0: Some(false),
        override_f0_method: None,
        transpose: None,
      }),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json,
      r#"{"cat":"vc","args":{"Vc":{"a":false}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn many_voice_conversion_args_serialize() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Vc {
        auto_predict_f0: Some(false),
        override_f0_method: Some(FundamentalFrequencyMethodForJob::Dio),
        transpose: Some(-1),
      }),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json,
               r#"{"cat":"vc","args":{"Vc":{"a":false,"fm":"d","t":-1}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn voice_conversion_args_do_not_serialize_none() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Vc {
        auto_predict_f0: None, // NB: Do not serialize
        override_f0_method: None,
        transpose: None,
      }),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json,
               r#"{"cat":"vc","args":{"Vc":{}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn serialize_nullable_form() {
    let mut args : Option<GenericInferenceArgs> = None;
    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json, "null");

    args = Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Vc {
        auto_predict_f0: Some(true),
        override_f0_method: None,
        transpose: None,
      }),
    });

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json,
               r#"{"cat":"vc","args":{"Vc":{"a":true}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }
}
