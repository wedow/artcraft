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
use artcraft_api_defs::generate::object::generate_hunyuan_2_image_to_3d::GenerateHunyuan2ImageTo3dRequest;
use artcraft_api_defs::generate::object::generate_hunyuan_2_image_to_3d::GenerateHunyuan2ImageTo3dResponse;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::visibility::Visibility;
use fal_client::requests::webhook::object::enqueue_hunyuan2_image_to_3d_webhook::enqueue_hunyuan2_image_to_3d_webhook;
use fal_client::requests::webhook::object::enqueue_hunyuan2_image_to_3d_webhook::Hunyuan2Args;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use idempotency::uuid::generate_random_uuid;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::get_media_file::{get_media_file, MediaFile};
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

// =============== Error Response ===============


#[derive(Debug, Serialize, ToSchema)]
pub enum GenerateHunyuan2ImageTo3dError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for GenerateHunyuan2ImageTo3dError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GenerateHunyuan2ImageTo3dError::BadInput(_) => StatusCode::BAD_REQUEST,
      GenerateHunyuan2ImageTo3dError::NotFound => StatusCode::NOT_FOUND,
      GenerateHunyuan2ImageTo3dError::NotAuthorized => StatusCode::UNAUTHORIZED,
      GenerateHunyuan2ImageTo3dError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GenerateHunyuan2ImageTo3dError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

/// Background removal
#[utoipa::path(
  post,
  tag = "Generate Objects",
  path = "/v1/generate/object/hunyuan_2_image_to_3d",
  responses(
    (status = 200, description = "Success", body = GenerateHunyuan2ImageTo3dResponse),
    (status = 400, description = "Bad input", body = GenerateHunyuan2ImageTo3dError),
    (status = 401, description = "Not authorized", body = GenerateHunyuan2ImageTo3dError),
    (status = 500, description = "Server error", body = GenerateHunyuan2ImageTo3dError),
  ),
  params(
    ("request" = GenerateHunyuan2ImageTo3dRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_hunyuan_2_image_to_3d_handler(
  http_request: HttpRequest,
  request: Json<GenerateHunyuan2ImageTo3dRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateHunyuan2ImageTo3dResponse>, GenerateHunyuan2ImageTo3dError> {
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GenerateHunyuan2ImageTo3dError::ServerError
      })?;

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  // TODO: Limit usage for new accounts. Billing, free credits metering, etc.

  //let user_session = match maybe_user_session {
  //  Some(session) => session,
  //  None => {
  //    warn!("not logged in");
  //    return Err(GenerateHunyuan2ImageTo3dError::NotAuthorized);
  //  }
  //};

  let media_file_token = match &request.media_file_token {
    Some(token) => token,
    None => {
      warn!("No media file token provided");
      return Err(GenerateHunyuan2ImageTo3dError::BadInput("No media file token provided".to_string()));
    }
  };
  
  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(GenerateHunyuan2ImageTo3dError::BadInput(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        GenerateHunyuan2ImageTo3dError::BadInput("invalid idempotency token".to_string())
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
      return Err(GenerateHunyuan2ImageTo3dError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up media_file: {:?}", err);
      return Err(GenerateHunyuan2ImageTo3dError::ServerError);
    }
  };

  if !media_file.media_type.is_jpg_or_png_or_legacy_image() {
    return Err(GenerateHunyuan2ImageTo3dError::BadInput("Media file must be a JPG or PNG image".to_string()));
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
  
  let args = Hunyuan2Args {
    image_url: media_links.cdn_url,
    webhook_url: &server_state.fal.webhook_url,
    api_key: &server_state.fal.api_key,
  };

  let fal_result = enqueue_hunyuan2_image_to_3d_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_hunyuan2_image_to_3d_webhook: {:?}", err);
        GenerateHunyuan2ImageTo3dError::ServerError
      })?;

  let external_job_id = fal_result.request_id
      .ok_or_else(|| {
        warn!("Fal request_id is None");
        GenerateHunyuan2ImageTo3dError::ServerError
      })?;
  
  info!("Fal request_id: {}", external_job_id);
  
  let ip_address = get_request_ip(&http_request);

  let db_result = insert_generic_inference_job_for_fal_queue(InsertGenericInferenceForFalArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    maybe_external_third_party_id: &external_job_id,
    fal_category: FalCategory::ObjectGeneration,
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
      return Err(GenerateHunyuan2ImageTo3dError::ServerError);
    }
  };

  Ok(Json(GenerateHunyuan2ImageTo3dResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
