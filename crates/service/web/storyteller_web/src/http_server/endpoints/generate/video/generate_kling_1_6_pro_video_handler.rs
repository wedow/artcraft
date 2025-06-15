use std::fmt;
use std::sync::Arc;

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
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
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::{GenerateKling16ProAspectRatio, GenerateKling16ProImageToVideoRequest};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::visibility::Visibility;
use fal_client::requests::webhook::video::enqueue_kling_16_pro_image_to_video_webhook::enqueue_kling_16_pro_image_to_video_webhook;
use fal_client::requests::webhook::video::enqueue_kling_16_pro_image_to_video_webhook::Kling16Duration;
use fal_client::requests::webhook::video::enqueue_kling_16_pro_image_to_video_webhook::Kling16ProArgs;
use fal_client::requests::webhook::video::enqueue_kling_16_pro_image_to_video_webhook::Kling16ProAspectRatio;
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

// =============== Error Response ===============


/*
 TODO: Either on the Tauri client or as an API, make "generic" image / video / object endpoints. 
  Take a reference image payload: 
  
    ReferenceImage {
      media_token: MediaFileToken,
      reference_type: ReferenceType
    } 
    
    enum ReferenceType {
      PrimaryReference,
      CharacterReference,
      LocationReference,
      StyleReference,
      ...
      GenericReference,
    }
    
    // **ORDER MATTERS**
    reference_images: Vec<ReferenceImage>,

*/

#[derive(Debug, Serialize, ToSchema)]
pub enum GenerateKling16VideoError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for GenerateKling16VideoError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GenerateKling16VideoError::BadInput(_) => StatusCode::BAD_REQUEST,
      GenerateKling16VideoError::NotFound => StatusCode::NOT_FOUND,
      GenerateKling16VideoError::NotAuthorized => StatusCode::UNAUTHORIZED,
      GenerateKling16VideoError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GenerateKling16VideoError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

/// Background removal
#[utoipa::path(
  post,
  tag = "Generate Videos",
  path = "/v1/generate/video/kling_1.6_pro_image_to_video",
  responses(
    (status = 200, description = "Success", body = RemoveImageBackgroundResponse),
    (status = 400, description = "Bad input", body = RemoveImageBackgroundError),
    (status = 401, description = "Not authorized", body = RemoveImageBackgroundError),
    (status = 500, description = "Server error", body = RemoveImageBackgroundError),
  ),
  params(
    ("request" = RemoveImageBackgroundRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_kling_1_6_pro_video_handler(
  http_request: HttpRequest,
  request: Json<GenerateKling16ProImageToVideoRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateKling16ProImageToVideoResponse>, GenerateKling16VideoError> {
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GenerateKling16VideoError::ServerError
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
      return Err(GenerateKling16VideoError::BadInput("No media file token provided".to_string()));
    }
  };
  
  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(GenerateKling16VideoError::BadInput(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        GenerateKling16VideoError::BadInput("invalid idempotency token".to_string())
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
      return Err(GenerateKling16VideoError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up media_file: {:?}", err);
      return Err(GenerateKling16VideoError::ServerError);
    }
  };

  if !media_file.media_type.is_jpg_or_png_or_legacy_image() {
    return Err(GenerateKling16VideoError::BadInput("Media file must be a JPG or PNG image".to_string()));
  }
  
  let media_domain = get_media_domain(&http_request);
  
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref());
  
  let media_links = MediaLinks::from_media_path_and_env(
    media_domain, 
    server_state.server_environment, 
    &bucket_path);
  
  info!("Fal webhook URL: {}", server_state.fal.webhook_url);
  
  let prompt = request.prompt
      .as_deref()
      .map(|prompt| prompt.trim())
      .unwrap_or_else(|| "");
  
  let aspect_ratio = match &request.aspect_ratio {
    Some(GenerateKling16ProAspectRatio::Square) => Kling16ProAspectRatio::Square,
    Some(GenerateKling16ProAspectRatio::WideSixteenNine) => Kling16ProAspectRatio::WideSixteenNine,
    Some(GenerateKling16ProAspectRatio::TallNineSixteen) => Kling16ProAspectRatio::TallNineSixteen,
    None => Kling16ProAspectRatio::WideSixteenNine, // Default to 16:9
  };
  
  let args = Kling16ProArgs {
    image_url: media_links.cdn_url,
    webhook_url: &server_state.fal.webhook_url,
    duration: Kling16Duration::Default,
    prompt: prompt,
    aspect_ratio: aspect_ratio,
    api_key: &server_state.fal.api_key,
  };

  let fal_result = enqueue_kling_16_pro_image_to_video_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling remove_background_rembg_webhook: {:?}", err);
        GenerateKling16VideoError::ServerError
      })?;

  let external_job_id = fal_result.request_id
      .ok_or_else(|| {
        warn!("Fal request_id is None");
        GenerateKling16VideoError::ServerError
      })?;
  
  info!("Fal request_id: {}", external_job_id);
  
  let ip_address = get_request_ip(&http_request);

  let db_result = insert_generic_inference_job_for_fal_queue(InsertGenericInferenceForFalArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    maybe_external_third_party_id: &external_job_id,
    fal_category: FalCategory::VideoGeneration,
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
      return Err(GenerateKling16VideoError::ServerError);
    }
  };

  Ok(Json(GenerateKling16ProImageToVideoResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
