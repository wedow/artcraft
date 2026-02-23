use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonVideoResolution;
use crate::api::common_video_model::CommonVideoModel;
use crate::api::provider::Provider;
use crate::client::router_client::RouterClient;

pub struct GenerateVideoRequest<'a> {
  /// Which model to use.
  pub model: CommonVideoModel,

  /// Which provider to use.
  pub provider: Provider,

  /// The prompt for the video generation
  pub prompt: Option<&'a str>,

  // /// Some models support negative prompts
  // pub negative_prompt: Option<String>,

  /// The resolution to use
  pub resolution: Option<CommonVideoResolution>,

  /// The aspect ratio to use
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// How many seconds to generate.
  pub duration_seconds: Option<u16>,

  /// How many videos to generate.
  pub video_batch_count: Option<u16>,

  // /// Whether to turn on/off audio.
  // /// Not all models support audio, not all models have a choice.
  // pub generate_audio: Option<bool>,

  /// Some providers support idempotency.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<&'a str>,

  /// The polymorphic router client, which can dispatch to multiple providers.
  pub client: &'a RouterClient,
}

impl <'a> GenerateVideoRequest<'a> {
  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.map(|t| t.to_string())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }
}
