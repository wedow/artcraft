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
use crate::server_state::ServerState;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{info, warn};
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::lipsync_payload::{LipsyncAnimationAudioSource, LipsyncAnimationImageSource, LipsyncArgs};
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{InsertGenericInferenceArgs, insert_generic_inference_job};
use std::sync::Arc;
use tokens::files::media_upload::MediaUploadToken;
use tokens::jobs::inference::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::voice_conversion_results::VoiceConversionResultToken;
use tokens::users::user::UserToken;
use tts_common::priority::FAKEYOU_INVESTOR_PRIORITY_LEVEL;

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME : &'static str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
const ROUTING_TAG_HEADER_NAME : &'static str = "routing-tag";

#[derive(Deserialize)]
pub struct EnqueueLipsyncAnimationRequest {
  uuid_idempotency_token: String,

  audio_source: AudioSource,
  image_source: ImageSource,

  creator_set_visibility: Option<Visibility>,
  is_storyteller_demo: Option<bool>,

  /// SadTalker: parameter to animate the full body.
  animate_full_body: Option<bool>,
}

/// Treated as an enum. Only one of these may be set.
#[derive(Deserialize)]
pub struct AudioSource {
  maybe_media_file_token: Option<MediaFileToken>,
  maybe_media_upload_token: Option<MediaUploadToken>,
  maybe_tts_result_token: Option<String>,
  maybe_voice_conversion_result_token: Option<VoiceConversionResultToken>,
}

/// Treated as an enum. Only one of these may be set.
#[derive(Deserialize)]
pub struct ImageSource {
  maybe_media_file_token: Option<MediaFileToken>,
  maybe_media_upload_token: Option<MediaUploadToken>,
}

#[derive(Serialize)]
pub struct EnqueueLipsyncAnimationSuccessResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

#[derive(Debug)]
pub enum EnqueueLipsyncAnimationError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for EnqueueLipsyncAnimationError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EnqueueLipsyncAnimationError::BadInput(_) => StatusCode::BAD_REQUEST,
      EnqueueLipsyncAnimationError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EnqueueLipsyncAnimationError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      EnqueueLipsyncAnimationError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EnqueueLipsyncAnimationError::BadInput(reason) => reason.to_string(),
      EnqueueLipsyncAnimationError::NotAuthorized => "unauthorized".to_string(),
      EnqueueLipsyncAnimationError::ServerError => "server error".to_string(),
      EnqueueLipsyncAnimationError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for EnqueueLipsyncAnimationError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn enqueue_lipsync_animation_handler(
  http_request: HttpRequest,
  request: web::Json<EnqueueLipsyncAnimationRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EnqueueLipsyncAnimationError>
{
  let mut maybe_user_token : Option<UserToken> = None;
  let mut priority_level ;
  let disable_rate_limiter = false; // NB: Careful!

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EnqueueLipsyncAnimationError::ServerError
      })?;

  // ==================== USER SESSION ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        EnqueueLipsyncAnimationError::ServerError
      })?;

  if let Some(user_session) = maybe_user_session.as_ref() {
    maybe_user_token = Some(UserToken::new_from_str(&user_session.user_token));
  }

  // TODO: Plan should handle "first anonymous use" and "investor" cases.
  let plan = get_correct_plan_for_session(
    server_state.server_environment,
    maybe_user_session.as_ref());

  // TODO: Separate priority for animation.
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
          return Err(EnqueueLipsyncAnimationError::NotAuthorized);
        }
        &server_state.redis_rate_limiters.logged_in
      },
    };

    // TODO/TEMP
    if is_investor {
      rate_limiter = &server_state.redis_rate_limiters.logged_in;
    }

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
      return Err(EnqueueLipsyncAnimationError::RateLimited);
    }
  }

  // ==================== LOOK UP MODEL INFO ==================== //

  // TODO(bt): CHECK DATABASE FOR TOKENS!

  let audio_source = {
    if let Some(ref token) = request.audio_source.maybe_media_file_token {
      LipsyncAnimationAudioSource::media_file_token(token.as_str())
    } else if let Some(ref token) = request.audio_source.maybe_media_upload_token {
      LipsyncAnimationAudioSource::media_upload_token(token.as_str())
    } else if let Some(ref token) = request.audio_source.maybe_tts_result_token {
      LipsyncAnimationAudioSource::tts_result_token(token)
    } else if let Some(ref token) = request.audio_source.maybe_voice_conversion_result_token {
      LipsyncAnimationAudioSource::voice_conversion_result_token(token.as_str())
    } else {
      return Err(EnqueueLipsyncAnimationError::BadInput("audio source not fully specified".to_string()));
    }
  };

  let image_source = {
    if let Some(ref token) = request.image_source.maybe_media_file_token {
      LipsyncAnimationImageSource::media_file_token(token.as_str())
    } else if let Some(ref token) = request.image_source.maybe_media_upload_token {
      LipsyncAnimationImageSource::media_upload_token(token.as_str())
    } else {
      return Err(EnqueueLipsyncAnimationError::BadInput("image source not fully specified".to_string()));
    }
  };

  // ==================== CHECK AND ENQUEUE ANIMATION ==================== //

  //let mut redis = server_state.redis_pool
  //    .get()
  //    .map_err(|e| {
  //      error!("redis error: {:?}", e);
  //      EnqueueLipsyncAnimationError::ServerError
  //    })?;

  //let redis_count_key = RedisKeys::web_vc_model_usage_count(model_token.as_str());

  //redis.incr(&redis_count_key, 1)
  //    .map_err(|e| {
  //      warn!("redis error: {:?}", e);
  //      EnqueueLipsyncAnimationError::ServerError
  //    })?;

  let ip_address = get_request_ip(&http_request);

  let maybe_user_preferred_visibility : Option<Visibility> = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferences.preferred_tts_result_visibility); // TODO: New setting for web-vc

  let set_visibility = request.creator_set_visibility
      .or(maybe_user_preferred_visibility)
      .unwrap_or(Visibility::Public);


  info!("Creating lipsync animation job record...");

  // TODO: other SadTalker arguments.
  let maybe_args = Some(PolymorphicInferenceArgs::La(LipsyncArgs {
    maybe_audio_source: Some(audio_source),
    maybe_image_source: Some(image_source),
  }));

  let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
    uuid_idempotency_token: &request.uuid_idempotency_token,
    inference_category: InferenceCategory::LipsyncAnimation,
    maybe_model_type: None, // NB: Model is static during inference
    maybe_model_token: None, // NB: Model is static during inference
    maybe_input_source_token: None, // TODO: Introduce a second foreign key ?
    maybe_input_source_token_type: None, // TODO: Introduce a second foreign key ?
    maybe_raw_inference_text: None, // No text
    maybe_inference_args: Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::LipsyncAnimation),
      args: maybe_args,
    }),
    maybe_creator_user_token: maybe_user_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: set_visibility,
    priority_level,
    requires_keepalive: plan.lipsync_requires_frontend_keepalive(),
    is_debug_request,
    maybe_routing_tag: maybe_routing_tag.as_deref(),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let job_token = match query_result {
    Ok((job_token, _id)) => job_token,
    Err(err) => {
      warn!("New generic inference job creation DB error: {:?}", err);
      return Err(EnqueueLipsyncAnimationError::ServerError);
    }
  };

  server_state.firehose_publisher.enqueue_lipsync_animation(
    maybe_user_token.as_ref(),
    &job_token)
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        EnqueueLipsyncAnimationError::ServerError
      })?;

  let response = EnqueueLipsyncAnimationSuccessResponse {
    success: true,
    inference_job_token: job_token,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| EnqueueLipsyncAnimationError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
