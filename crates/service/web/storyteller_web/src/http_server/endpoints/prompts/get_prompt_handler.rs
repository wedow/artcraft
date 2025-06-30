use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::ToSchema;

use enums::by_table::prompts::prompt_type::PromptType;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use mysql_queries::queries::prompts::get_prompt::get_prompt;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetPromptPathInfo {
  token: PromptToken,
}

#[derive(Serialize, ToSchema)]
pub struct GetPromptSuccessResponse {
  pub success: bool,
  pub prompt: PromptInfo,
}

#[derive(Serialize, ToSchema)]
pub struct PromptInfo {
  pub token: PromptToken,

  /// The type of prompt.
  /// Note: Prompts may or may not be compatible across systems.
  pub prompt_type: PromptType,
  
  /// Positive prompt (technically optional, but usually present)
  pub maybe_positive_prompt: Option<String>,

  /// Negative prompt (optional)
  pub maybe_negative_prompt: Option<String>,

  /// Scheduled / travel prompt (optional)
  pub maybe_travel_prompt: Option<String>,

  /// If a "style" was used, this is the name of it.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub maybe_style_name: Option<StyleTransferName>,

  /// How many milliseconds it took to run generation.
  pub maybe_inference_duration_millis: Option<u64>,

  /// If a "strength" was used.
  /// Typically only for video style transfer.
  pub maybe_strength: Option<f32>,

  /// If a frame skip setting was used.
  pub maybe_frame_skip: Option<u8>,

  /// If a face detailer was used.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub used_face_detailer: bool,

  /// If an upscaling pass was used.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub used_upscaler: bool,

  /// If lipsync was enabled.
  /// This might not be present for all types of inference
  /// and typically only applies to video style transfer.
  pub lipsync_enabled: bool,

  /// If LCM was disabled.
  /// Only staff can do this for now.
  pub lcm_disabled: bool,

  /// If the cinematic workflow was used.
  /// Only staff can do this for now.
  pub use_cinematic: bool,

  /// If a global IP Adapter Image was used, this is the details.
  /// NB: We can't easily query for this without another DB round trip,
  /// so the frontend should query for it instead.
  pub maybe_global_ipa_image_token: Option<MediaFileToken>,

  // TODO: Author of prompt info

  /// Fields that only moderators should see.
  pub maybe_moderator_fields: Option<PromptInfoModeratorFields>,

  pub created_at: DateTime<Utc>,
}

#[derive(Serialize, ToSchema)]
pub struct PromptInfoModeratorFields {
  /// How many milliseconds it took to run generation.
  pub maybe_inference_duration_millis: Option<u64>,

  /// Version of Yae's workflow
  /// Used for logging and debugging by the art team.
  pub main_ipa_workflow: Option<String>,

  /// Version of Yae's face detailer workflow
  /// Used for logging and debugging by the art team.
  pub face_detailer_workflow: Option<String>,

  /// Version of Yae's upscaler workflow
  /// Used for logging and debugging by the art team.
  pub upscaler_workflow: Option<String>,
}

#[derive(Debug, ToSchema)]
pub enum GetPromptError {
  ServerError,
  NotFound,
}

impl ResponseError for GetPromptError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetPromptError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetPromptError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      GetPromptError::ServerError => "server error".to_string(),
      GetPromptError::NotFound => "not found".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for GetPromptError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  get,
  tag = "Prompts",
  path = "/v1/prompts/{token}",
  responses(
    (status = 200, description = "Found", body = GetPromptSuccessResponse),
    (status = 404, description = "Not found", body = GetPromptError),
    (status = 500, description = "Server error", body = GetPromptError),
  ),
  params(
    ("path" = GetPromptPathInfo, description = "Path for Request")
  )
)]
pub async fn get_prompt_handler(
  http_request: HttpRequest,
  path: Path<GetPromptPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, GetPromptError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetPromptError::ServerError
      })?;

  let is_moderator = maybe_user_session
      .map(|session| session.can_ban_users)
      .unwrap_or(false);

  let prompt_token = path.into_inner().token;

  let result = get_prompt(
    &prompt_token,
    &server_state.mysql_pool
  ).await;

  let result = match result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(GetPromptError::ServerError);
    }
    Ok(None) => return Err(GetPromptError::NotFound),
    Ok(Some(result)) => result,
  };

  let mut maybe_style_name = None;
  let mut maybe_strength = None;
  let mut maybe_inference_duration_millis = None;
  let mut maybe_global_ipa_image_token = None;
  let mut maybe_travel_prompt = None;
  let mut maybe_frame_skip = None;

  // Flags
  let mut used_face_detailer = false;
  let mut used_upscaler = false;
  let mut lipsync_enabled = false;
  let mut lcm_disabled = false;
  let mut use_cinematic = false;

  // Moderator fields
  let mut main_ipa_workflow = None;
  let mut face_detailer_workflow = None;
  let mut upscaler_workflow = None;

  if let Some(inner_payload) = &result.maybe_other_args {
    if let Some(encoded_style_name) = &inner_payload.style_name {
      maybe_style_name = encoded_style_name.to_style_name();
    }
    maybe_strength = inner_payload.strength;
    maybe_inference_duration_millis = inner_payload.inference_duration_millis;
    maybe_global_ipa_image_token = inner_payload.global_ipa_token.clone();
    maybe_travel_prompt = inner_payload.travel_prompt.clone();
    maybe_frame_skip = inner_payload.frame_skip;

    // Flags
    used_face_detailer = inner_payload.used_face_detailer.unwrap_or(false);
    used_upscaler = inner_payload.used_upscaler.unwrap_or(false);
    lipsync_enabled = inner_payload.lipsync_enabled.unwrap_or(false);
    lcm_disabled = inner_payload.disable_lcm.unwrap_or(false);
    use_cinematic = inner_payload.use_cinematic.unwrap_or(false);

    // Moderator fields
    main_ipa_workflow = inner_payload.main_ipa_workflow.clone();
    face_detailer_workflow = inner_payload.face_detailer_workflow.clone();
    upscaler_workflow = inner_payload.upscaler_workflow.clone();
  }

  let mut maybe_moderator_fields = None;

  if is_moderator {
    maybe_moderator_fields = Some(PromptInfoModeratorFields {
      maybe_inference_duration_millis,
      main_ipa_workflow,
      face_detailer_workflow,
      upscaler_workflow,
    });
  }

  let response = GetPromptSuccessResponse {
    success: true,
    prompt: PromptInfo {
      token: result.token,
      maybe_strength,
      maybe_positive_prompt: result.maybe_positive_prompt,
      maybe_negative_prompt: result.maybe_negative_prompt,
      maybe_travel_prompt,
      maybe_style_name,
      maybe_inference_duration_millis,
      used_face_detailer,
      used_upscaler,
      lipsync_enabled,
      lcm_disabled,
      use_cinematic,
      prompt_type: result.prompt_type,
      created_at: result.created_at,
      maybe_moderator_fields,
      maybe_global_ipa_image_token,
      maybe_frame_skip,
    },
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| GetPromptError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
