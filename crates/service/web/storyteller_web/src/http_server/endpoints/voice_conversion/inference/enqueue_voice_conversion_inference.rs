// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpResponse, HttpRequest};
use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::endpoints::investor_demo::demo_cookie::request_has_demo_cookie;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::memory_cache::model_token_to_info_cache::{ModelInfoLite, ModelTokenToInfoCache};
use crate::server_state::ServerState;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{FundamentalFrequencyMethodForJob, GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{InsertGenericInferenceArgs, insert_generic_inference_job};
use mysql_queries::queries::voice_conversion::model_info_lite::get_voice_conversion_model_info_lite::get_voice_conversion_model_info_lite_with_connection;
use r2d2_redis::redis::Commands;
use redis_common::redis_keys::RedisKeys;
use sqlx::MySql;
use sqlx::pool::PoolConnection;
use std::fmt;
use std::sync::Arc;
use tokens::files::media_upload::MediaUploadToken;
use tokens::jobs::inference::InferenceJobToken;
use tokens::users::user::UserToken;
use tokens::voice_conversion::model::VoiceConversionModelToken;
use tts_common::priority::FAKEYOU_INVESTOR_PRIORITY_LEVEL;

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME : &str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
const ROUTING_TAG_HEADER_NAME : &str = "routing-tag";

#[derive(Deserialize)]
pub struct EnqueueVoiceConversionInferenceRequest {
  uuid_idempotency_token: String,
  voice_conversion_model_token: VoiceConversionModelToken,

  // TODO: Make media upload token optional and allow result audio to be re-used as well
  source_media_upload_token: MediaUploadToken,

  creator_set_visibility: Option<Visibility>,
  is_storyteller_demo: Option<bool>,

  /// Argument for so-vits-svc
  /// The python model defaults to true, but that sounds awful,
  /// so we default to false unless specified.
  auto_predict_f0: Option<bool>,

  /// Argument for so-vits-svc
  /// f0 estimation
  override_f0_method: Option<FundamentalFrequencyMethod>,

  /// Argument for so-vits-svc
  /// Pitch controls for so-vits-svc
  transpose: Option<i32>,
}

#[derive(Deserialize, Clone, Copy)]
pub enum FundamentalFrequencyMethod {
  #[serde(rename = "crepe")]
  Crepe,
  #[serde(rename = "dio")]
  Dio,
  #[serde(rename = "harvest")]
  Harvest,
}

#[derive(Serialize)]
pub struct EnqueueVoiceConversionInferenceSuccessResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

#[derive(Debug)]
pub enum EnqueueVoiceConversionInferenceError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for EnqueueVoiceConversionInferenceError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueVoiceConversionInferenceError::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueVoiceConversionInferenceError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EnqueueVoiceConversionInferenceError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueVoiceConversionInferenceError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EnqueueVoiceConversionInferenceError::BadInput(reason) => reason.to_string(),
      EnqueueVoiceConversionInferenceError::NotAuthorized => "unauthorized".to_string(),
      EnqueueVoiceConversionInferenceError::ServerError => "server error".to_string(),
      EnqueueVoiceConversionInferenceError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EnqueueVoiceConversionInferenceError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn enqueue_voice_conversion_inference_handler(
  http_request: HttpRequest,
  request: web::Json<EnqueueVoiceConversionInferenceRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EnqueueVoiceConversionInferenceError>
{
  let mut maybe_user_token : Option<UserToken> = None;
  let mut priority_level ;
  let disable_rate_limiter = false; // NB: Careful!

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  // ==================== USER SESSION ==================== //

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      EnqueueVoiceConversionInferenceError::ServerError
    })?;

  if let Some(user_session) = maybe_user_session.as_ref() {
    maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
  }

  // TODO: Plan should handle "first anonymous use" and "investor" cases.
  let plan = get_correct_plan_for_session(
    server_state.server_environment,
    maybe_user_session.as_ref());

  priority_level = plan.web_vc_base_priority_level();

  // ==================== INVESTOR PRIORITY ==================== //

  // TODO/TEMP: Give investors even more priority
  let mut is_investor = false;

  {
    // TODO/TEMP: The storyteller.io website's AJAX calls will set this.
    //  This is just for the YCombinator demo.
    match request.is_storyteller_demo {
      Some(true) => {
        is_investor = true;
      },
      _ => {},
    };

    // TODO/TEMP: The storyteller.io website will redirect and establish this cookie.
    //  This is just for the YCombinator demo.
    if request_has_demo_cookie(&http_request) {
      is_investor = true;
    }

    if is_investor {
      priority_level = FAKEYOU_INVESTOR_PRIORITY_LEVEL;
    }
  }

  // ==================== DEBUG MODE + ROUTING TAG ==================== //

  let is_debug_request =
      get_request_header_optional(&http_request, DEBUG_HEADER_NAME)
          .is_some();

  let maybe_routing_tag=
      get_request_header_optional(&http_request, ROUTING_TAG_HEADER_NAME)
          .map(|routing_tag| routing_tag.trim().to_string());

  // ==================== RATE LIMIT ==================== //

  if !disable_rate_limiter {
    let mut rate_limiter = match maybe_user_session {
      None => &server_state.redis_rate_limiters.logged_out,
      Some(ref user) => {
        if user.role.is_banned {
          return Err(EnqueueVoiceConversionInferenceError::NotAuthorized);
        }
        &server_state.redis_rate_limiters.logged_in
      },
    };

    // TODO/TEMP
    if is_investor {
      rate_limiter = &server_state.redis_rate_limiters.logged_in;
    }

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
      return Err(EnqueueVoiceConversionInferenceError::RateLimited);
    }
  }

  // ==================== LOOK UP MODEL INFO ==================== //

  // TODO(bt): CHECK DATABASE!
  let model_token = request.voice_conversion_model_token.clone();
  let media_token = request.source_media_upload_token.clone();

  let model_info_lite  = lookup_model_info(
    &model_token,
    &server_state.caches.durable.model_token_info,
    &mut mysql_connection
  ).await?;

  // ==================== CHECK AND ENQUEUE VOICE CONVERSION ==================== //

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        error!("redis error: {:?}", e);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  let redis_count_key = RedisKeys::web_vc_model_usage_count(model_token.as_str());

  redis.incr(&redis_count_key, 1)
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  let ip_address = get_request_ip(&http_request);

  let maybe_user_preferred_visibility : Option<Visibility> = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferences.preferred_tts_result_visibility); // TODO: New setting for web-vc

  let set_visibility = request.creator_set_visibility
      .or(maybe_user_preferred_visibility)
      .unwrap_or(Visibility::Public);


  info!("Creating voice conversion inference job record...");

  let mut maybe_args = None;

  let set_args = request.auto_predict_f0.is_some()
      || request.transpose.is_some()
      || request.override_f0_method.is_some();

  if set_args {
    maybe_args = Some(PolymorphicInferenceArgs::Vc {
      auto_predict_f0: request.auto_predict_f0,
      override_f0_method: request.override_f0_method.map(|f| match f {
        FundamentalFrequencyMethod::Crepe => FundamentalFrequencyMethodForJob::Crepe,
        FundamentalFrequencyMethod::Dio => FundamentalFrequencyMethodForJob::Dio,
        FundamentalFrequencyMethod::Harvest => FundamentalFrequencyMethodForJob::Harvest,
      }),
      transpose: request.transpose,
    });
  }

  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    inference_category: InferenceCategory::VoiceConversion,
    maybe_model_type: Some(model_info_lite.model_type),
    maybe_model_token: Some(model_token.as_str()),
    maybe_input_source_token: Some(media_token.as_str()),
    maybe_input_source_token_type: Some(InferenceInputSourceTokenType::MediaUpload),
    maybe_raw_inference_text: None, // NB: Voice conversion isn't TTS, so there's no text.
    maybe_inference_args: Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: maybe_args,
    }),
    maybe_creator_user_token: maybe_user_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: set_visibility,
    priority_level,
    requires_keepalive: plan.web_vc_requires_frontend_keepalive(),
    is_debug_request,
    maybe_routing_tag: maybe_routing_tag.as_deref(),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let job_token = match query_result {
    Ok((job_token, _id)) => job_token,
    Err(err) => {
      warn!("New generic inference job creation DB error: {:?}", err);
      return Err(EnqueueVoiceConversionInferenceError::ServerError);
    }
  };

  server_state.firehose_publisher.enqueue_vc_inference(
    maybe_user_token.as_ref(),
    &job_token)
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  let response = EnqueueVoiceConversionInferenceSuccessResponse {
    success: true,
    inference_job_token: job_token,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| EnqueueVoiceConversionInferenceError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}

async fn lookup_model_info(
  model_token: &VoiceConversionModelToken,
  cache: &ModelTokenToInfoCache,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<ModelInfoLite, EnqueueVoiceConversionInferenceError> {
  let maybe_model_token_info = cache
      .get_info(model_token.as_str())
      .map_err(|err| {
        error!("in-memory cache error: {:?}", err);
        EnqueueVoiceConversionInferenceError::ServerError
      })?;

  let model_token_info = match maybe_model_token_info {
    Some(info) => info,
    None => {
      let result = get_voice_conversion_model_info_lite_with_connection(
        model_token.as_str(), mysql_connection)
          .await
          .map_err(|err| {
            error!("model lookup error: {:?}", err);
            EnqueueVoiceConversionInferenceError::ServerError
          })?;

      match result {
        Some(info) => {
          let model_type = match info.model_type {
            VoiceConversionModelType::RvcV2 => InferenceModelType::RvcV2,
            VoiceConversionModelType::SoVitsSvc => InferenceModelType::SoVitsSvc,
            VoiceConversionModelType::SoftVc => {
              // SoftVC is unsupported
              return Err(EnqueueVoiceConversionInferenceError::BadInput("wrong model type".to_string()));
            }
          };

          let model_info = ModelInfoLite {
            inference_category: InferenceCategory::VoiceConversion,
            model_type,
          };

          cache.insert_one(model_token.as_str(), &model_info)
              .map_err(|err| {
                error!("cache insertion error: {:?}", err);
                EnqueueVoiceConversionInferenceError::ServerError
              })?;

          model_info
        }
        None => {
          // NB: Fail open for now.
          ModelInfoLite {
            inference_category: InferenceCategory::VoiceConversion,
            model_type: InferenceModelType::SoVitsSvc,
          }
        }
      }
    }
  };

  Ok(model_token_info)
}
