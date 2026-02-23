use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video::GenerateVideoResponse;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount, Seedance2p0MultiFunctionVideoGenRequest,
};
use storyteller_client::endpoints::generate::video::multi_function::seedance_2p0_multi_function_video_gen::seedance_2p0_multi_function_video_gen;

fn map_aspect_ratio(aspect_ratio: Option<CommonAspectRatio>) -> Option<Seedance2p0AspectRatio> {
  match aspect_ratio {
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Some(Seedance2p0AspectRatio::Landscape16x9)
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Some(Seedance2p0AspectRatio::Portrait9x16)
    }
    Some(CommonAspectRatio::Square) => Some(Seedance2p0AspectRatio::Square1x1),
    Some(CommonAspectRatio::WideFourByThree) => Some(Seedance2p0AspectRatio::Standard4x3),
    Some(CommonAspectRatio::TallThreeByFour) => Some(Seedance2p0AspectRatio::Portrait3x4),
    _ => None,
  }
}

pub async fn generate_video_artcraft_seedance2p0(
  request: &GenerateVideoRequest<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  
  let uuid_idempotency_token = request.get_or_generate_idempotency_token();
  let aspect_ratio = map_aspect_ratio(request.aspect_ratio);
  let prompt = request.prompt.map(|p| p.to_string());
  
  let batch_count = match request.video_batch_count {
    Some(1) => Seedance2p0BatchCount::One,
    Some(2) => Seedance2p0BatchCount::Two,
    Some(4) => Seedance2p0BatchCount::Four,
    _ => Seedance2p0BatchCount::One,
  };

  let request = Seedance2p0MultiFunctionVideoGenRequest {
    uuid_idempotency_token,
    prompt,
    start_frame_media_token: None,
    end_frame_media_token: None,
    reference_image_media_tokens: None,
    aspect_ratio,
    duration_seconds: None,
    batch_count: Some(batch_count),
  };

  let response = seedance_2p0_multi_function_video_gen(
    &artcraft_client.api_host,
    Some(&artcraft_client.credentials),
    request,
  )
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

  Ok(GenerateVideoResponse {
    inference_job_token: response.inference_job_token,
    all_inference_job_tokens: response.all_inference_job_tokens,
  })
}
