use std::fmt;
use std::sync::Arc;

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links::MediaLinks;
use crate::http_server::deprecated_endpoints::engine::create_scene_handler::CreateSceneError;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::{GenerateFlux1DevTextToImageAspectRatio, GenerateFlux1DevTextToImageNumImages, GenerateFlux1DevTextToImageRequest, GenerateFlux1DevTextToImageResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::visibility::Visibility;
use fal_client::requests::webhook::image::enqueue_flux_1_dev_text_to_image_webhook::enqueue_flux_1_dev_text_to_image_webhook;
use fal_client::requests::webhook::image::enqueue_flux_1_dev_text_to_image_webhook::{Flux1DevArgs, Flux1DevAspectRatio, Flux1DevNumImages};
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use idempotency::uuid::generate_random_uuid;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::get_media_file::{get_media_file, MediaFile};
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

/// Flux 1 Dev text to image
#[utoipa::path(
  post,
  tag = "Generate Images",
  path = "/v1/generate/image/flux_1_dev_text_to_image",
  responses(
    (status = 200, description = "Success", body = GenerateFlux1DevTextToImageResponse),
  ),
  params(
    ("request" = GenerateFlux1DevTextToImageRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_flux_1_dev_text_to_image_handler(
  http_request: HttpRequest,
  request: Json<GenerateFlux1DevTextToImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateFlux1DevTextToImageResponse>, CommonWebError> {
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
  //    return Err(CommonWebError::NotAuthorized);
  //  }
  //};

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;
  
  const IS_MOD : bool = false;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);
  
  let aspect_ratio = match request.aspect_ratio {
    Some(GenerateFlux1DevTextToImageAspectRatio::Square) => Flux1DevAspectRatio::Square,
    Some(GenerateFlux1DevTextToImageAspectRatio::SquareHd) => Flux1DevAspectRatio::SquareHd,
    Some(GenerateFlux1DevTextToImageAspectRatio::LandscapeFourByThree) => Flux1DevAspectRatio::LandscapeFourByThree,
    Some(GenerateFlux1DevTextToImageAspectRatio::LandscapeSixteenByNine) => Flux1DevAspectRatio::LandscapeSixteenByNine,
    Some(GenerateFlux1DevTextToImageAspectRatio::PortraitThreeByFour) => Flux1DevAspectRatio::PortraitThreeByFour,
    Some(GenerateFlux1DevTextToImageAspectRatio::PortraitNineBySixteen) => Flux1DevAspectRatio::PortraitNineBySixteen,
    None => Flux1DevAspectRatio::LandscapeSixteenByNine, // Default
  };
  
  let num_images = match request.num_images {
    Some(GenerateFlux1DevTextToImageNumImages::One) => Flux1DevNumImages::One,
    Some(GenerateFlux1DevTextToImageNumImages::Two) => Flux1DevNumImages::Two,
    Some(GenerateFlux1DevTextToImageNumImages::Three) => Flux1DevNumImages::Three,
    Some(GenerateFlux1DevTextToImageNumImages::Four) => Flux1DevNumImages::Four,
    None => Flux1DevNumImages::One, // Default
  };

  let args = Flux1DevArgs {
    prompt: request.prompt.as_deref().unwrap_or(""),
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
    aspect_ratio,
    num_images,
  };

  let fal_result = enqueue_flux_1_dev_text_to_image_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_flux_1_dev_text_to_image_webhook: {:?}", err);
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
    fal_category: FalCategory::ImageGeneration,
    maybe_inference_args: None,
    maybe_creator_user_token: maybe_user_session.as_ref().map(|s| &s.user_token),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: Visibility::Public,
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let job_token = match db_result {
    Ok(token) => token,
    Err(err) => {
      warn!("Error inserting generic inference job for FAL queue: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  Ok(Json(GenerateFlux1DevTextToImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
