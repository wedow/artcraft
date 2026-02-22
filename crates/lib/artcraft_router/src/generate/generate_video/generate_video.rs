use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonVideoResolution;
use crate::api::common_video_model::CommonVideoModel;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::providers::artcraft::generate_video_artcraft_seedance2p0::generate_video_artcraft_seedance2p0;
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::utils::api_host::ApiHost;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

pub struct GenerateVideoArgs {
  pub model: CommonVideoModel,
  pub resolution: Option<CommonVideoResolution>,
  pub aspect_ratio: Option<CommonAspectRatio>,
  pub prompt: Option<String>,
}

pub struct GenerateVideoResponse {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

pub struct GenerateVideoContext<'a> {
  pub api_host: &'a ApiHost,
  pub storyteller_creds: Option<&'a StorytellerCredentialSet>,
}

pub async fn generate_video(
  args: &GenerateVideoArgs,
  context: &GenerateVideoContext<'_>,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  match args.model {
    CommonVideoModel::Seedance2p0 => {
      generate_video_artcraft_seedance2p0(args, context.api_host, context.storyteller_creds).await
    }
    _ => Err(ArtcraftRouterError::UnsupportedModel(format!("{:?}", args.model))),
  }
}
