use crate::api::common_video_model::CommonVideoModel;
use crate::api::provider::Provider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_seedance2p0::generate_video_artcraft_seedance2p0;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

// The flow is thus:
// Generate Video Request -> Generate Video Plan (testable + cost estimate) -> Generate Video -> Job details

pub struct GenerateVideoResponse {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

pub async fn generate_video(
  args: &GenerateVideoRequest<'_>,
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
