use actix_http::Error;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{Responder, web, HttpResponse, error, HttpRequest, HttpMessage};
use buckets::public::voice_conversion_results::original_file::VoiceConversionResultOriginalFilePath;
use chrono::{DateTime, Utc};
use crate::AnyhowResult;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use log::{info, warn, log, error};
use mysql_queries::queries::generic_inference::web::get_inference_job_status::get_inference_job_status;
use mysql_queries::queries::tts::tts_inference_jobs::get_tts_inference_job_status::get_tts_inference_job_status;
use r2d2_redis::RedisConnectionManager;
use r2d2_redis::r2d2::{Pool, PooledConnection};
use r2d2_redis::redis::{Commands, RedisError, RedisResult};
use redis_common::redis_keys::RedisKeys;
use regex::Regex;
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::borrow::BorrowMut;
use std::fmt;
use std::ops::Deref;
use std::sync::Arc;
use tokens::jobs::inference::InferenceJobToken;

/// For certain jobs or job classes (eg. non-premium), we kill the jobs if the user hasn't
/// maintained a keepalive. This prevents wasted work when users who are unlikely to return
/// navigate away. Premium users have accounts and can always return to the site, so they
/// typically do not require keepalive.
const JOB_KEEPALIVE_TTL_SECONDS : usize = 60 * 3;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetInferenceJobStatusPathInfo {
  token: InferenceJobToken,
}

#[derive(Serialize)]
pub struct GetInferenceJobStatusSuccessResponse {
  pub success: bool,
  pub state: InferenceJobStatusResponsePayload,
}

#[derive(Serialize)]
pub struct InferenceJobStatusResponsePayload {
  pub job_token: InferenceJobToken,

  pub request: RequestDetailsResponse,
  pub status: StatusDetailsResponse,
  pub maybe_result: Option<ResultDetailsResponse>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct RequestDetailsResponse {
  pub inference_category: InferenceCategory,
  pub maybe_model_type: Option<String>,
  pub maybe_model_token: Option<String>,
  /// Title of the model, if it has one
  pub maybe_model_title: Option<String>,

  /// If the result was TTS, this is the raw inference text.
  pub maybe_raw_inference_text: Option<String>,
}

#[derive(Serialize)]
pub struct StatusDetailsResponse {
  /// Primary status from the database (a state machine).
  pub status: String,

  /// Extra, temporary status from Redis.
  /// This can denote inference progress, and the Python code can write to it.
  pub maybe_extra_status_description: Option<String>,

  pub maybe_assigned_worker: Option<String>,
  pub maybe_assigned_cluster: Option<String>,

  pub maybe_first_started_at: Option<DateTime<Utc>>,

  pub attempt_count: u8,

  /// Whether the frontend needs to maintain a keepalive check.
  /// This is typically only for non-premium users.
  pub requires_keepalive: bool,
}

#[derive(Serialize)]
pub struct ResultDetailsResponse {
  pub entity_type: String,
  pub entity_token: String,

  /// NB: This is only for audio- or video- type results.
  pub maybe_public_bucket_media_path: Option<String>,

  pub maybe_successfully_completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug)]
pub enum GetInferenceJobStatusError {
  ServerError,
  NotFound,
}

impl ResponseError for GetInferenceJobStatusError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetInferenceJobStatusError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetInferenceJobStatusError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      Self::ServerError => "server error".to_string(),
      Self::NotFound => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetInferenceJobStatusError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}


pub async fn get_inference_job_status_handler(
  http_request: HttpRequest,
  path: Path<GetInferenceJobStatusPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetInferenceJobStatusError>
{
  if path.token.as_str().trim() == "None" {
    // NB: A bunch of Python clients use our API and can fail in this manner.
    // This was a large traffic driver during the 2023-03-08 outage.
    return Err(GetInferenceJobStatusError::NotFound);
  }

  // NB: Lookup failure is Err(RowNotFound).
  // NB: Since this is publicly exposed, we don't query sensitive data.
  let maybe_status = get_inference_job_status(&path.token, &server_state.mysql_pool).await;

  let record = match maybe_status {
    Ok(Some(record)) => record,
    Ok(None) => return Err(GetInferenceJobStatusError::NotFound),
    Err(err) => {
      error!("tts job query error: {:?}", err);
      return Err(GetInferenceJobStatusError::ServerError);
    }
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        error!("redis error: {:?}", e);
        GetInferenceJobStatusError::ServerError
      })?;

  // TODO(bt,2023-05-21): Make async.
  let extra_status_key = RedisKeys::generic_inference_extra_status_info(path.token.as_str());
  let maybe_extra_status_description : Option<String> = match redis.get(&extra_status_key) {
    Ok(Some(status)) => {
      Some(status)
    },
    Ok(None) => None,
    Err(e) => {
      error!("redis error: {:?}", e);
      None // Fail open
    },
  };

  if record.is_keepalive_required {
    // TODO(bt,2023-05-21): Make async.
    let keepalive_key = RedisKeys::generic_inference_keepalive(path.token.as_str());
    let _: Option<String> = match redis.set_ex(&extra_status_key, "1", JOB_KEEPALIVE_TTL_SECONDS) {
      Ok(Some(status)) => {
        Some(status)
      },
      Ok(None) => None,
      Err(e) => {
        error!("redis error setting job keepalive: {:?}", e);
        None // Fail open (which in this case is bad! it will kill jobs if cluster has many jobs / is slow!)
      },
    };
  }

  let inference_category = record.request_details.inference_category.clone();

  let record_for_response = InferenceJobStatusResponsePayload {
    job_token: record.job_token,
    request: RequestDetailsResponse {
      inference_category: record.request_details.inference_category,
      maybe_model_type: record.request_details.maybe_model_type,
      maybe_model_token: record.request_details.maybe_model_token,
      maybe_model_title: record.request_details.maybe_model_title,
      maybe_raw_inference_text: record.request_details.maybe_raw_inference_text,
    },
    status: StatusDetailsResponse {
      status: record.status,
      maybe_extra_status_description,
      maybe_assigned_worker: record.maybe_assigned_worker,
      maybe_assigned_cluster: record.maybe_assigned_cluster,
      maybe_first_started_at: record.maybe_first_started_at,
      attempt_count: record.attempt_count as u8,
      requires_keepalive: record.is_keepalive_required,
    },
    maybe_result: record.maybe_result_details.map(|result_details| {
      let public_bucket_media_path = match inference_category {
        InferenceCategory::LipsyncAnimation => {
          // TODO
          "TODO".to_string()
        }
        InferenceCategory::TextToSpeech => {
          // NB: TTS results receive the legacy treatment where their table only reports the full bucket path
          result_details.public_bucket_location_or_hash
        }
        InferenceCategory::VoiceConversion => {
          VoiceConversionResultOriginalFilePath::from_object_hash(&result_details.public_bucket_location_or_hash)
              .get_full_object_path_str()
              .to_string()
        }
      };

      ResultDetailsResponse {
        entity_type: result_details.entity_type,
        entity_token: result_details.entity_token,
        maybe_public_bucket_media_path: Some(public_bucket_media_path),
        maybe_successfully_completed_at: result_details.maybe_successfully_completed_at,
      }
    }),
    created_at: record.created_at,
    updated_at: record.updated_at,
  };

  let response = GetInferenceJobStatusSuccessResponse {
    success: true,
    state: record_for_response,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| {
        error!("error returning response: {:?}",  e);
        GetInferenceJobStatusError::ServerError
      })?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
