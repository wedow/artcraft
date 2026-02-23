use crate::api::common_video_model::CommonVideoModel;
use crate::api::provider::Provider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::providers::artcraft::generate_video_artcraft_seedance2p0::generate_video_artcraft_seedance2p0;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

// The flow is thus:
// Generate Video Request -> Generate Video Plan (testable + cost estimate) -> Generate Video -> Job details

pub struct GenerateVideoResponse {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

fn validate_request(args: &GenerateVideoRequest<'_>) -> Result<(), ClientError> {
  if args.start_frame_url.is_some() && args.start_frame_media_token.is_some() {
    return Err(ClientError::UrlAndMediaTokenSupplied("start_frame".to_string()));
  }
  if args.end_frame_url.is_some() && args.end_frame_media_token.is_some() {
    return Err(ClientError::UrlAndMediaTokenSupplied("end_frame".to_string()));
  }
  if args.reference_image_urls.is_some() && args.reference_image_media_tokens.is_some() {
    return Err(ClientError::UrlAndMediaTokenSupplied("reference_images".to_string()));
  }
  Ok(())
}

pub async fn generate_video(
  args: &GenerateVideoRequest<'_>,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  validate_request(args)?;

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
