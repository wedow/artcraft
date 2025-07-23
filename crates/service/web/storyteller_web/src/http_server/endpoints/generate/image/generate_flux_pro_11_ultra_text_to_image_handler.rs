use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageResponse;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::{GenerateFluxPro11UltraTextToImageAspectRatio, GenerateFluxPro11UltraTextToImageNumImages, GenerateFluxPro11UltraTextToImageRequest};
use enums::common::visibility::Visibility;
use fal_client::requests::webhook::image::enqueue_flux_pro_11_ultra_text_to_image_webhook::FluxPro11UltraArgs;
use fal_client::requests::webhook::image::enqueue_flux_pro_11_ultra_text_to_image_webhook::{enqueue_flux_pro_11_ultra_text_to_image_webhook, FluxPro11UltraAspectRatio, FluxPro11UltraNumImages};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use utoipa::ToSchema;


/// Flux Pro 1.1 Ultra
#[utoipa::path(
  post,
  tag = "Generate Images",
  path = "/v1/generate/image/flux_pro_1.1_ultra_text_to_image",
  responses(
    (status = 200, description = "Success", body = GenerateFluxPro11UltraTextToImageResponse),
  ),
  params(
    ("request" = GenerateFluxPro11UltraTextToImageRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_flux_pro_11_ultra_text_to_image_handler(
  http_request: HttpRequest,
  request: Json<GenerateFluxPro11UltraTextToImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateFluxPro11UltraTextToImageResponse>, CommonWebError> {
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
  //    return Err(GenerateFluxProUltraTextToImageError::NotAuthorized);
  //  }
  //};

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
  
  info!("Fal webhook URL: {}", server_state.fal.webhook_url);
  
  let aspect_ratio = match request.aspect_ratio {
    Some(GenerateFluxPro11UltraTextToImageAspectRatio::Square) => FluxPro11UltraAspectRatio::Square,
    Some(GenerateFluxPro11UltraTextToImageAspectRatio::LandscapeFourByThree) => FluxPro11UltraAspectRatio::LandscapeFourByThree,
    Some(GenerateFluxPro11UltraTextToImageAspectRatio::LandscapeSixteenByNine) => FluxPro11UltraAspectRatio::LandscapeSixteenByNine,
    Some(GenerateFluxPro11UltraTextToImageAspectRatio::PortraitThreeByFour) => FluxPro11UltraAspectRatio::PortraitThreeByFour,
    Some(GenerateFluxPro11UltraTextToImageAspectRatio::PortraitNineBySixteen) => FluxPro11UltraAspectRatio::PortraitNineBySixteen,
    None => FluxPro11UltraAspectRatio::LandscapeSixteenByNine, // Default
  };
  
  let num_images = match request.num_images {
    Some(GenerateFluxPro11UltraTextToImageNumImages::One) => FluxPro11UltraNumImages::One,
    Some(GenerateFluxPro11UltraTextToImageNumImages::Two) => FluxPro11UltraNumImages::Two,
    Some(GenerateFluxPro11UltraTextToImageNumImages::Three) => FluxPro11UltraNumImages::Three,
    Some(GenerateFluxPro11UltraTextToImageNumImages::Four) => FluxPro11UltraNumImages::Four,
    None => FluxPro11UltraNumImages::One, // Default
  };

  let args = FluxPro11UltraArgs {
    prompt: request.prompt.as_deref().unwrap_or(""),
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
    aspect_ratio,
    num_images,
  };

  let fal_result = enqueue_flux_pro_11_ultra_text_to_image_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_flux_pro_ultra_text_to_image_webhook: {:?}", err);
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

  Ok(Json(GenerateFluxPro11UltraTextToImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
