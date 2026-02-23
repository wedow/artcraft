use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonVideoResolution;
use crate::api::common_video_model::CommonVideoModel;
use crate::api::provider::Provider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::providers::artcraft::generate_video_artcraft_seedance2p0::generate_video_artcraft_seedance2p0;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

// The flow is thus:
// Generate Video Request -> Generate Video Plan (testable + cost estimate) -> Generate Video -> Job details

pub struct GenerateVideoArgs<'a> {
  /// Which model to use.
  pub model: CommonVideoModel,

  /// Which provider to use.
  pub provider: Provider,

  /// The prompt for the video generation
  pub prompt: Option<String>,

  // /// Some models support negative prompts
  // pub negative_prompt: Option<String>,

  /// The resolution to use
  pub resolution: Option<CommonVideoResolution>,

  /// The aspect ratio to use
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// How many seconds to generate.
  pub duration_seconds: Option<u16>,

  // /// Whether to turn on/off audio.
  // /// Not all models support audio, not all models have a choice.
  // pub generate_audio: Option<bool>,

  /// The polymorphic router client, which can dispatch to multiple providers.
  pub client: &'a RouterClient,
}

pub struct GenerateVideoResponse {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

pub async fn generate_video(
  args: &GenerateVideoArgs<'_>,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  match args.provider {
    Provider::Artcraft => {
      let artcraft_client = args.client.get_artcraft_client_ref()?;
      match args.model {
        CommonVideoModel::Seedance2p0 => {
          generate_video_artcraft_seedance2p0(args, artcraft_client).await
        }
        _ => Err(ArtcraftRouterError::UnsupportedModel(format!("{:?}", args.model))),
      }
    }
  }
}
