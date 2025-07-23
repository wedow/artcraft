use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteDuration;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteResolution;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::visibility::Visibility;
use fal_client::requests::webhook::video::enqueue_seedance_1_lite_image_to_video_webhook::enqueue_seedance_1_lite_image_to_video_webhook;
use fal_client::requests::webhook::video::enqueue_seedance_1_lite_image_to_video_webhook::Seedance1LiteDuration;
use fal_client::requests::webhook::video::enqueue_seedance_1_lite_image_to_video_webhook::{Seedance1LiteArgs, Seedance1LiteResolution};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use utoipa::ToSchema;

/// Seedance 1.0 Lite Image to Video
#[utoipa::path(
  post,
  tag = "Generate Videos",
  path = "/v1/generate/video/seedance_1.0_lite_image_to_video",
  responses(
    (status = 200, description = "Success", body = GenerateSeedance10LiteImageToVideoResponse),
  ),
  params(
    ("request" = GenerateSeedance10LiteImageToVideoRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_seedance_1_0_lite_image_to_video_handler(
  http_request: HttpRequest,
  request: Json<GenerateSeedance10LiteImageToVideoRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateSeedance10LiteImageToVideoResponse>, CommonWebError> {
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::ServerError
      })?;

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  // TODO: Limit usage for new accounts. Billing, free credits metering, etc.

  //let user_session = match maybe_user_session {
  //  Some(session) => session,
  //  None => {
  //    warn!("not logged in");
  //    return Err(RemoveImageBackgroundError::NotAuthorized);
  //  }
  //};

  let media_file_token = match &request.media_file_token {
    Some(token) => token,
    None => {
      warn!("No media file token provided");
      return Err(CommonWebError::BadInputWithSimpleMessage("No media file token provided".to_string()));
    }
  };
  
  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("invalid idempotency token".to_string())
      })?;
  const IS_MOD : bool = false;
  
  let media_file_lookup_result = get_media_file(
    media_file_token,
    IS_MOD,
    &server_state.mysql_pool,
  ).await;

  let media_file = match media_file_lookup_result {
    Ok(Some(media_file)) => media_file,
    Ok(None) => {
      warn!("MediaFile not found: {:?}", media_file_token);
      return Err(CommonWebError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up media_file: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  if !media_file.media_type.is_jpg_or_png_or_legacy_image() {
    return Err(CommonWebError::BadInputWithSimpleMessage("Media file must be a JPG or PNG image".to_string()));
  }
  
  let media_domain = get_media_domain(&http_request);
  
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref());
  
  let media_links = MediaLinksBuilder::from_media_path_and_env(
    media_domain, 
    server_state.server_environment, 
    &bucket_path);
  
  info!("Fal webhook URL: {}", server_state.fal.webhook_url);
  
  let prompt = request.prompt
      .as_deref()
      .map(|prompt| prompt.trim())
      .unwrap_or_else(|| "");
  
  let resolution = match &request.resolution {
    Some(GenerateSeedance10LiteResolution::FourEightyP) => Seedance1LiteResolution::FourEightyP,
    Some(GenerateSeedance10LiteResolution::SevenTwentyP) => Seedance1LiteResolution::SevenTwentyP,
    None => Seedance1LiteResolution::SevenTwentyP,
  };
  
  let duration = match &request.duration {
    Some(GenerateSeedance10LiteDuration::FiveSeconds) => Seedance1LiteDuration::FiveSeconds,
    Some(GenerateSeedance10LiteDuration::TenSeconds) => Seedance1LiteDuration::TenSeconds,
    None => Seedance1LiteDuration::FiveSeconds, 
  };
  
  let args = Seedance1LiteArgs {
    image_url: media_links.cdn_url,
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
    duration,
    resolution,
    prompt,
    camera_fixed: false, // TODO: Parameterize
    seed: None, // TODO: Parameterize
  };

  let fal_result = enqueue_seedance_1_lite_image_to_video_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_seedance_1_lite_image_to_video_webhook: {:?}", err);
        CommonWebError::ServerError
      })?;

  let external_job_id = fal_result.request_id
      .ok_or_else(|| {
        warn!("Fal request_id is None");
        CommonWebError::ServerError
      })?;
  
  info!("Fal request_id: {}", external_job_id);
  
  let ip_address = get_request_ip(&http_request);

  let db_result = insert_generic_inference_job_for_fal_queue(InsertGenericInferenceForFalArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    maybe_external_third_party_id: &external_job_id,
    fal_category: FalCategory::VideoGeneration,
    maybe_inference_args: None,
    maybe_prompt_token: None,
    maybe_creator_user_token: maybe_user_session.as_ref().map(|s| &s.user_token),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: Visibility::Public,
    mysql_executor: &server_state.mysql_pool,
    phantom: Default::default(),
  }).await;

  let job_token = match db_result {
    Ok(token) => token,
    Err(err) => {
      warn!("Error inserting generic inference job for FAL queue: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  Ok(Json(GenerateSeedance10LiteImageToVideoResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
