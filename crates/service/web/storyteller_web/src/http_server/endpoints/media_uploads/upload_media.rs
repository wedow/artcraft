use actix_http::Error;
use actix_multipart::Multipart;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::http::header;
use actix_web::web::BytesMut;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use buckets::public::media_uploads::original_file::MediaUploadOriginalFilePath;
use config::bad_urls::is_bad_tts_model_download_url;
use crate::http_server::endpoints::media_uploads::drain_multipart_request::drain_multipart_request;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;
use crate::validations::model_uploads::validate_model_title;
use crate::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use database_queries::payloads::media_upload_details::MediaUploadDetails;
use database_queries::queries::media_uploads::insert_media_upload::{Args, insert_media_upload};
use enums::core::visibility::Visibility;
use enums::files::media_upload_type::MediaUploadType;
use files::hash::hash_bytes_sha2;
use files::mimetype::{get_mimetype_for_bytes, get_mimetype_for_bytes_or_default};
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn, log};
use media::decode_basic_audio_info::decode_basic_audio_info;
use regex::Regex;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::io::{BufReader, Cursor};
use std::sync::Arc;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::{MediaSourceStream, ReadOnlySource};
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use tokens::files::media_upload::MediaUploadToken;

#[derive(Serialize)]
pub struct UploadMediaSuccessResponse {
  pub success: bool,
  pub upload_token: MediaUploadToken,
}

#[derive(Debug, Serialize)]
pub enum UploadMediaError {
  BadInput(String),
  NotAuthorized,
  MustBeLoggedIn,
  ServerError,
  RateLimited,
}

impl ResponseError for UploadMediaError {
  fn status_code(&self) -> StatusCode {
    match *self {
      UploadMediaError::BadInput(_) => StatusCode::BAD_REQUEST,
      UploadMediaError::NotAuthorized => StatusCode::UNAUTHORIZED,
      UploadMediaError::MustBeLoggedIn => StatusCode::UNAUTHORIZED,
      UploadMediaError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      UploadMediaError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for UploadMediaError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn upload_media_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  mut multipart_payload: Multipart,
) -> Result<HttpResponse, UploadMediaError> {

  // ==================== READ SESSION ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        UploadMediaError::ServerError
      })?;

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.logged_out,
    Some(ref user) => {
      if user.is_banned {
        return Err(UploadMediaError::NotAuthorized);
      }
      &server_state.redis_rate_limiters.logged_in
    },
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
    return Err(UploadMediaError::RateLimited);
  }

  if let Err(_err) = server_state.redis_rate_limiters.model_upload.rate_limit_request(&http_request) {
    return Err(UploadMediaError::RateLimited);
  }

  // ==================== READ MULTIPART REQUEST ==================== //

  let upload_media_request = drain_multipart_request(multipart_payload)
      .await
      .map_err(|e| {
        // TODO: Error handling could be nicer.
        UploadMediaError::BadInput("bad request".to_string())
      })?;


  let uuid_idempotency_token = upload_media_request.uuid_idempotency_token
      .ok_or(UploadMediaError::BadInput("no uuid".to_string()))?;

  if let Err(reason) = validate_idempotency_token_format(&uuid_idempotency_token) {
    return Err(UploadMediaError::BadInput(reason));
  }

  let creator_set_visibility = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferred_tts_result_visibility) // TODO: We need a new type of visibility control.
      .unwrap_or(Visibility::default());

  let ip_address = get_request_ip(&http_request);

  let maybe_user_token = maybe_user_session
      .map(|session| session.get_strongly_typed_user_token());

  let token = MediaUploadToken::generate();

  let maybe_mimetype = upload_media_request.file_bytes
      .as_ref()
      .map(|bytes| get_mimetype_for_bytes(bytes.as_ref()))
      .flatten();

  let maybe_hash = upload_media_request.file_bytes
      .as_ref()
      .map(|bytes| hash_bytes_sha2(bytes.as_ref()))
      .transpose()
      .map_err(|io_error| {
        warn!("Problem hashing bytes: {:?}", io_error);
        return UploadMediaError::ServerError;
      })?;

  let hash = match maybe_hash {
    None => return Err(UploadMediaError::BadInput("invalid file".to_string())),
    Some(hash) => hash,
  };

  let bytes = match upload_media_request.file_bytes {
    None => return Err(UploadMediaError::BadInput("invalid file".to_string())),
    Some(bytes) => bytes,
  };

  let file_size_bytes = bytes.len();

  let mut maybe_duration_millis = None;
  let mut maybe_codec_name = None;
  let mut media_upload_type = None;

  if let Some(mimetype) = maybe_mimetype.as_deref() {
    // NB: .aiff (audio/aiff) isn't supported by Symphonia:
    //  It contains uncompressed PCM-encoded audio similar to wav.
    //  See: https://github.com/pdeljanov/Symphonia/issues/75
    // NB: The following formats are not supported by Symphonia and
    //  do not have any open issues filed. They may simply be too old:
    //  - .wma (audio/x-ms-wma)
    //  - .avi (video/x-msvideo)
    media_upload_type = match mimetype {
      // Audio
      "audio/aac" /* .aac */ => Some(MediaUploadType::Audio),
      "audio/m4a" /* .m4a */ => Some(MediaUploadType::Audio),
      "audio/mpeg" /* .mp3 */ => Some(MediaUploadType::Audio),
      "audio/ogg" /* .ogg */ => Some(MediaUploadType::Audio),
      "audio/x-flac" /* .flac */ => Some(MediaUploadType::Audio),
      "audio/x-wav" /* .wav */ => Some(MediaUploadType::Audio),
      // Video
      "video/mp4" /* .mp4 */ => Some(MediaUploadType::Video),
      "video/quicktime" /* .mov */ => Some(MediaUploadType::Video),
      "video/webm" /* .webm */ => Some(MediaUploadType::Video),
      _ => None,
    };

    if media_upload_type.is_some() {
      let basic_info = decode_basic_audio_info(
        bytes.as_ref(),
        Some(mimetype),
        None
      ).map_err(|e| {
        warn!("file decoding error: {:?}", e);
        UploadMediaError::BadInput("could not decode file".to_string())
      })?;

      maybe_duration_millis = basic_info.duration_millis;
      maybe_codec_name = basic_info.codec_name;
    }
  }

  let media_upload_type = match media_upload_type {
    Some(m) => m,
    None => {
      warn!("Invalid mimetype: {:?}", maybe_mimetype);
      return Err(UploadMediaError::BadInput(format!("Bad mimetype: {:?}", maybe_mimetype)))
    },
  };

  // TODO: Clean up code
  let mime_type = match maybe_mimetype {
    Some(m) => m,
    None => {
      warn!("Missing mimetype!");
      return Err(UploadMediaError::BadInput("Missing mimetype".to_string()));
    },
  };

  let public_upload_path = MediaUploadOriginalFilePath::generate_new();

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    bytes.as_ref(),
    &mime_type)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        UploadMediaError::ServerError
      })?;

  let record_id = insert_media_upload(Args {
    token: &token,
    uuid_idempotency_token: &uuid_idempotency_token,
    media_type: media_upload_type,
    maybe_original_filename: upload_media_request.file_name.as_deref(),
    original_file_size_bytes: file_size_bytes as u64,
    maybe_original_duration_millis: maybe_duration_millis,
    maybe_original_mime_type: maybe_mimetype,
    maybe_original_audio_encoding: maybe_codec_name.as_deref(),
    maybe_original_video_encoding: None,
    maybe_original_frame_width: None,
    maybe_original_frame_height: None,
    checksum_sha2: &hash,
    public_upload_path: &public_upload_path,
    extra_file_modification_info: MediaUploadDetails {}, // TODO
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: None,
    creator_ip_address: &ip_address,
    creator_set_visibility,
    maybe_creator_synthetic_id: None, // TODO: Don't forget about this.
    mysql_pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New generic download creation DB error: {:?}", err);
        UploadMediaError::ServerError
      })?;

  info!("new media upload id: {}", record_id);

  server_state.firehose_publisher.publish_media_uploaded(
    maybe_user_token.as_ref(),
    &token)
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        UploadMediaError::ServerError
      })?;

  let response = UploadMediaSuccessResponse {
    success: true,
    upload_token: token,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| UploadMediaError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
