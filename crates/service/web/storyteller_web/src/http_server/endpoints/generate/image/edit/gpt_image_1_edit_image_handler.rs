use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{GptImage1EditImageImageQuality, GptImage1EditImageImageSize, GptImage1EditImageNumImages, GptImage1EditImageRequest, GptImage1EditImageResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::visibility::Visibility;
use fal_client::creds::open_ai_api_key::OpenAiApiKey;
use fal_client::requests::webhook::image::enqueue_gpt_image_1_edit_image_webhook::enqueue_gpt_image_1_edit_image_webhook;
use fal_client::requests::webhook::image::enqueue_gpt_image_1_edit_image_webhook::GptEditImageNumImages;
use fal_client::requests::webhook::image::enqueue_gpt_image_1_edit_image_webhook::{GptEditImageByokArgs, GptEditImageQuality, GptEditImageSize};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::batch_get_media_files_by_tokens;
use utoipa::ToSchema;

/// Gpt Image 1 Image Editing
#[utoipa::path(
  post,
  tag = "Generate Images (Edit)",
  path = "/v1/generate/image/edit/gpt_image_1",
  responses(
    (status = 200, description = "Success", body = GptImage1EditImageResponse),
  ),
  params(
    ("request" = GptImage1EditImageRequest, description = "Payload for Request"),
  )
)]
pub async fn gpt_image_1_edit_image_handler(
  http_request: HttpRequest,
  request: Json<GptImage1EditImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GptImage1EditImageResponse>, CommonWebError> {
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

  const CAN_SEE_DELETED: bool = false;
  
  let tokens = match request.image_media_tokens.as_ref() {
    Some(tokens) => tokens,
    None => {
      warn!("No image media tokens provided");
      return Err(CommonWebError::BadInputWithSimpleMessage("No image media tokens provided".to_string()));
    }
  };
  
  let result = batch_get_media_files_by_tokens(
    &server_state.mysql_pool,
    tokens,
    CAN_SEE_DELETED,
  ).await;
  
  let media_files = match result {
    Ok(files) => files,
    Err(err) => {
      error!("Error getting media files by tokens: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };
  
  if media_files.len() != tokens.len() {
    warn!("Wrong number of media files returned for tokens: {} found for {} tokens", media_files.len(), tokens.len());
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("Not all media files could be found. Media files found: {}, tokens provided: {}",
        media_files.len(), tokens.len())));
  }

  let media_domain = get_media_domain(&http_request);
  
  let image_urls = media_files.iter()
      .map(|file| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &file.public_bucket_directory_hash,
          file.maybe_public_bucket_prefix.as_deref(),
          file.maybe_public_bucket_extension.as_deref());
        
        let media_links = MediaLinksBuilder::from_media_path_and_env(
          media_domain, 
          server_state.server_environment, 
          &public_bucket_path);
        
        media_links.cdn_url.to_string()
      })
      .collect::<Vec<_>>();

  insert_idempotency_token(&request.uuid_idempotency_token, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);

  let image_size = match request.image_size {
    Some(GptImage1EditImageImageSize::Square) => GptEditImageSize::Square,
    Some(GptImage1EditImageImageSize::Horizontal) => GptEditImageSize::Horizontal,
    Some(GptImage1EditImageImageSize::Vertical) => GptEditImageSize::Vertical,
    None => GptEditImageSize::Square, // Default to Square
  };

  let num_images = match request.num_images {
    Some(GptImage1EditImageNumImages::One) => GptEditImageNumImages::One,
    Some(GptImage1EditImageNumImages::Two) => GptEditImageNumImages::Two,
    Some(GptImage1EditImageNumImages::Three) => GptEditImageNumImages::Three,
    Some(GptImage1EditImageNumImages::Four) => GptEditImageNumImages::Four,
    None => GptEditImageNumImages::One, // Default to One
  };
  
  let quality = match request.image_quality {
    Some(quality) => match quality {
      GptImage1EditImageImageQuality::Auto => GptEditImageQuality::Auto,
      GptImage1EditImageImageQuality::Low => GptEditImageQuality::Low,
      GptImage1EditImageImageQuality::Medium => GptEditImageQuality::Medium,
      GptImage1EditImageImageQuality::High => GptEditImageQuality::High,
    },
    None => GptEditImageQuality::High, // Default to High
  };
  
  let openai_api_key = OpenAiApiKey::from_str(&server_state.openai.api_key);

  let args = GptEditImageByokArgs {
    image_urls,
    prompt: request.prompt.as_deref().unwrap_or(""),
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
    num_images,
    image_size,
    quality,
    openai_api_key: &openai_api_key,
  };

  let fal_result = enqueue_gpt_image_1_edit_image_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_gpt_image_1_edit_image_webhook: {:?}", err);
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

  Ok(Json(GptImage1EditImageResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
