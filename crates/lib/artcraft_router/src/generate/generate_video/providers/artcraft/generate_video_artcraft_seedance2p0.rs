use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video::{GenerateVideoArgs, GenerateVideoResponse};
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount, Seedance2p0MultiFunctionVideoGenRequest,
};
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::endpoints::generate::video::multi_function::seedance_2p0_multi_function_video_gen::seedance_2p0_multi_function_video_gen;
use storyteller_client::utils::api_host::ApiHost;
use uuid::Uuid;

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
  args: &GenerateVideoArgs,
  api_host: &ApiHost,
  creds: Option<&StorytellerCredentialSet>,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let uuid_idempotency_token = Uuid::new_v4().to_string(); // TODO: Make this an optional top-level arg

  let aspect_ratio = map_aspect_ratio(args.aspect_ratio);

  let request = Seedance2p0MultiFunctionVideoGenRequest {
    uuid_idempotency_token,
    prompt: args.prompt.clone(),
    start_frame_media_token: None,
    end_frame_media_token: None,
    reference_image_media_tokens: None,
    aspect_ratio,
    duration_seconds: None,
    batch_count: Some(Seedance2p0BatchCount::One),
  };

  let response = seedance_2p0_multi_function_video_gen(api_host, creds, request)
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

  Ok(GenerateVideoResponse {
    inference_job_token: response.inference_job_token,
    all_inference_job_tokens: response.all_inference_job_tokens,
  })
}
