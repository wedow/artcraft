// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpResponse, HttpRequest};
use users_component::utils::crypted_cookie_manager::CryptedCookie;
use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::http_server::endpoints::investor_demo::demo_cookie::request_has_demo_cookie;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;
use database_queries::queries::tts::tts_inference_jobs::insert_tts_inference_job::TtsInferenceJobInsertBuilder;
use database_queries::tokens::Tokens;
use enums::core::visibility::Visibility;
use http_server_common::request::get_request_api_token::get_request_api_token;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{info, warn};
use r2d2_redis::redis::Commands;
use redis_common::redis_keys::RedisKeys;
use std::fmt;
use std::sync::Arc;
use tts_common::priority::{FAKEYOU_INVESTOR_PRIORITY_LEVEL, FAKEYOU_DEFAULT_VALID_API_TOKEN_PRIORITY_LEVEL};
use user_input_common::check_for_slurs::contains_slurs;

// TODO: Temporary for investor demo
const STORYTELLER_DEMO_COOKIE_NAME : &'static str = "storyteller_demo";

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME : &'static str = "enable_debug_mode";

#[derive(Deserialize)]
pub struct InferTtsRequest {
  uuid_idempotency_token: String,
  tts_model_token: String,
  inference_text: String,
  creator_set_visibility: Option<Visibility>,
  is_storyteller_demo: Option<bool>,
}

#[derive(Serialize)]
pub struct InferTtsSuccessResponse {
  pub success: bool,
  pub inference_job_token: String,
}

#[derive(Debug)]
pub enum InferTtsError {
  BadInput(String),
  NotAuthorized,
  ServerError,
  RateLimited,
}

impl ResponseError for InferTtsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      InferTtsError::BadInput(_) => StatusCode::BAD_REQUEST,
      InferTtsError::NotAuthorized => StatusCode::UNAUTHORIZED,
      InferTtsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      InferTtsError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      InferTtsError::BadInput(reason) => reason.to_string(),
      InferTtsError::NotAuthorized => "unauthorized".to_string(),
      InferTtsError::ServerError => "server error".to_string(),
      InferTtsError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for InferTtsError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn infer_tts_handler(
  http_request: HttpRequest,
  request: web::Json<InferTtsRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, InferTtsError>
{
  let mut is_from_api = false;
  let mut maybe_user_token : Option<String> = None;
  let mut maybe_avt: Option<String> = None;
  let mut priority_level ;
  let mut use_high_priority_rate_limiter = false; // NB: Careful!
  let mut disable_rate_limiter = false; // NB: Careful!

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        InferTtsError::ServerError
      })?;

  // ==================== USER SESSION ==================== //

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      InferTtsError::ServerError
    })?;

  if let Some(user_session) = maybe_user_session.as_ref() {
    maybe_user_token = Some(user_session.user_token.to_string());
  }

  if let Some(cookie) = http_request.cookie("avt") {
    let maybe_map = server_state.ccm.decrypt_cookie_to_map(&CryptedCookie(cookie));
    if maybe_map.is_ok() {
        let map = maybe_map.unwrap();
        maybe_avt = map.get("avt").cloned();
    }
  }

  // TODO: Plan should handle "first anonymous use" and "investor" cases.
  let plan = get_correct_plan_for_session(
    server_state.server_environment,
    maybe_user_session.as_ref());

  priority_level = plan.tts_base_priority_level();

  // ==================== API TOKENS ==================== //

  if let Some(api_token) = get_request_api_token(&http_request) {
    let maybe_api_token_configs = server_state
        .static_api_token_set
        .get_api_token(&api_token);

    if let Some(api_token_configs) = maybe_api_token_configs {
      is_from_api = true;

      priority_level = api_token_configs.maybe_priority_level
          .unwrap_or(FAKEYOU_DEFAULT_VALID_API_TOKEN_PRIORITY_LEVEL);

      use_high_priority_rate_limiter = api_token_configs.maybe_use_high_priority_rate_limiter
          .unwrap_or(false);

      disable_rate_limiter = api_token_configs.maybe_disable_rate_limiter.unwrap_or(false);

      if let Some(user_token_override) = api_token_configs.maybe_user_token.as_deref() {
        maybe_user_token = Some(user_token_override.trim().to_string());
      }
    }
  }

  // ==================== INVESTOR PRIORITY ==================== //

  // TODO/TEMP: Give investors even more priority
  let mut is_investor = false;

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

  // ==================== DEBUG MODE ==================== //

  let is_debug_request = get_request_header_optional(&http_request, DEBUG_HEADER_NAME)
      .is_some();

  // ==================== RATE LIMIT ==================== //

  if !disable_rate_limiter {
    let mut rate_limiter = match maybe_user_session {
      None => &server_state.redis_rate_limiters.logged_out,
      Some(ref user) => {
        if user.role.is_banned {
          return Err(InferTtsError::NotAuthorized);
        }
        &server_state.redis_rate_limiters.logged_in
      },
    };

    // TODO/TEMP
    if is_investor || is_from_api {
      rate_limiter = &server_state.redis_rate_limiters.logged_in;
    }

    // TODO: This is for VidVoice.ai and should be replaced with per-API consumer rate limiters
    if use_high_priority_rate_limiter {
      rate_limiter = &server_state.redis_rate_limiters.api_high_priority;
    }

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
      return Err(InferTtsError::RateLimited);
    }
  }

  // ==================== CHECK AND PERFORM TTS ==================== //

  let inference_text = &request.inference_text.trim().to_string();

  if let Err(reason) = validate_inference_text(&inference_text) {
    return Err(InferTtsError::BadInput(reason));
  }

  if contains_slurs(&inference_text) {
    return Err(InferTtsError::BadInput("text contains slurs".to_string()));
  }

  // TODO(bt): CHECK DATABASE!
  let model_token = request.tts_model_token.to_string();

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        InferTtsError::ServerError
      })?;

  let redis_count_key = RedisKeys::tts_model_usage_count(&model_token);

  redis.incr(&redis_count_key, 1)
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        InferTtsError::ServerError
      })?;

  let ip_address = get_request_ip(&http_request);

  let maybe_user_preferred_visibility : Option<Visibility> = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferences.preferred_tts_result_visibility);

  let set_visibility = request.creator_set_visibility
      .or(maybe_user_preferred_visibility)
      .unwrap_or(Visibility::Public);

  // This token is returned to the client.
  let job_token = Tokens::new_tts_inference_job()
      .map_err(|_e| {
        warn!("Error creating token");
        InferTtsError::ServerError
      })?;

  info!("Creating tts inference job record...");

  let query_result = TtsInferenceJobInsertBuilder::new_for_fakeyou_request()
      .set_job_token(&job_token)
      .set_uuid_idempotency_token(&request.uuid_idempotency_token)
      .set_model_token(&model_token)
      .set_raw_inference_text(&inference_text)
      .set_maybe_creator_user_token(maybe_user_token.as_deref())
      .set_maybe_creator_anonymous_visitor_token(maybe_avt.as_deref())
      .set_creator_ip_address(&ip_address)
      .set_creator_set_visibility(set_visibility.to_str())
      .set_priority_level(priority_level)
      .set_max_duration_seconds(plan.tts_max_duration_seconds())
      .set_is_from_api(is_from_api)
      .set_is_debug_request(is_debug_request)
      .insert(&server_state.mysql_pool)
      .await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("New tts inference job creation DB error: {:?}", err);
      return Err(InferTtsError::ServerError);
    }
  }

  server_state.firehose_publisher.enqueue_tts_inference(maybe_user_token.as_deref(), &job_token, &model_token)
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        InferTtsError::ServerError
      })?;

  let response = InferTtsSuccessResponse {
    success: true,
    inference_job_token: job_token.to_string(),
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| InferTtsError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}

pub fn validate_inference_text(text: &str) -> Result<(), String> {
  if text.len() < 3 {
    return Err("text is too short".to_string());
  }

  if text.len() > 1024 {
    return Err("text is too long".to_string());
  }

  Ok(())
}
