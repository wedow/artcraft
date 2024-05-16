// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use log::{error, info, warn};
use utoipa::ToSchema;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
use mysql_queries::payloads::generic_inference_args::workflow_payload::WorkflowArgs;
use mysql_queries::queries::generic_inference::web::insert_generic_inference_job::{insert_generic_inference_job, InsertGenericInferenceArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use primitives::str_to_bool::str_to_bool;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use users_component::session::lookup::user_session_extended::UserSessionExtended;

use crate::configs::plans::get_correct_plan_for_session::get_correct_plan_for_session;
use crate::configs::plans::plan_category::PlanCategory;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::server_state::ServerState;
use crate::util::allowed_video_style_transfer_access::allowed_video_style_transfer_access;
use crate::validations::validate_idempotency_token_format::validate_idempotency_token_format;

/// Debug requests can get routed to special "debug-only" workers, which can
/// be used to trial new code, run debugging, etc.
const DEBUG_HEADER_NAME : &str = "enable-debug-mode";

/// The routing tag header can send workloads to particular k8s hosts.
/// This is useful for catching the live logs or intercepting the job.
const ROUTING_TAG_HEADER_NAME : &str = "routing-tag";

/// The default ending trim point of a video if not supplied in the request.
const DEFAULT_TRIM_MILLISECONDS_END : u64 = 3_000;

/// This is the maximum duration (for premium users)
const MAXIMUM_DURATION_MILLIS : u64 = 10_000;

/// Strength of Diffusion:
///  * Range (0.0 - 1.0)
///  * 0.0 less dreamy
///  * 1.0 dream more
///  * The Python code will default to "1.0" if not supplied
const MINIMUM_STRENGTH : f32 = 0.0;
const MAXIMUM_STRENGTH : f32 = 1.0;
const DEFAULT_STRENGTH : f32 = 1.0;

#[derive(Deserialize, ToSchema)]
pub struct EnqueueVideoStyleTransferRequest {
    /// Entropy for request de-duplication (required)
    uuid_idempotency_token: String,

    /// The name of the style to invoke (required)
    style: StyleTransferName,

    /// The input video media file (required)
    input_file: MediaFileToken,

    /// The positive prompt (optional)
    prompt: Option<String>,
    
    /// The negative prompt (optional)
    negative_prompt: Option<String>,
    
    /// Optional trim start in milliseconds
    trim_start_millis: Option<u64>,
    
    /// Optional trim end in milliseconds
    trim_end_millis: Option<u64>,

    /// Enable lipsyncing in the workflow
    enable_lipsync: Option<bool>,

    /// Remove watermark from the output
    /// Only for premium accounts
    remove_watermark: Option<bool>,

    /// Use face detailer
    /// Only for premium accounts
    use_face_detailer: Option<bool>,

    /// Use video upscaler
    /// Only for premium accounts
    use_upscaler: Option<bool>,

    /// Use Strength of the style transfer
    use_strength: Option<f32>,

    /// Optional visibility setting override.
    creator_set_visibility: Option<Visibility>,

    // TODO(bt,2024-05-13): Plumb this through to jobs.
    /// Optional Global IP-Adapter image.
    /// The underlying media file must be an image.
    ipa_media_token: Option<MediaFileToken>,
}

#[derive(Serialize, ToSchema)]
pub struct EnqueueVideoStyleTransferSuccessResponse {
    pub success: bool,
    pub inference_job_token: InferenceJobToken,
}

#[derive(Debug, ToSchema)]
pub enum EnqueueVideoStyleTransferError {
    BadInput(String),
    NotAuthorized,
    ServerError,
    RateLimited,
}

impl ResponseError for EnqueueVideoStyleTransferError {
    fn status_code(&self) -> StatusCode {
        match *self {
            EnqueueVideoStyleTransferError::BadInput(_) => StatusCode::BAD_REQUEST,
            EnqueueVideoStyleTransferError::NotAuthorized => StatusCode::UNAUTHORIZED,
            EnqueueVideoStyleTransferError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            EnqueueVideoStyleTransferError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let error_reason = match self {
            EnqueueVideoStyleTransferError::BadInput(reason) => reason.to_string(),
            EnqueueVideoStyleTransferError::NotAuthorized => "unauthorized".to_string(),
            EnqueueVideoStyleTransferError::ServerError => "server error".to_string(),
            EnqueueVideoStyleTransferError::RateLimited => "rate limited".to_string(),
        };

        to_simple_json_error(&error_reason, self.status_code())
    }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for EnqueueVideoStyleTransferError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[utoipa::path(
    post,
    tag = "Video Style Transfer",
    path = "/v1/video/enqueue_vst",
    responses(
    (
        status = 200,
        description = "Enqueue Video Style Transfer",
        body = EnqueueVideoStyleTransferSuccessResponse,
    ),
        (status = 400, description = "Bad input", body = EnqueueVideoStyleTransferError),
        (status = 401, description = "Not authorized", body = EnqueueVideoStyleTransferError),
        (status = 429, description = "Rate limited", body = EnqueueVideoStyleTransferError),
        (status = 500, description = "Server error", body = EnqueueVideoStyleTransferError)
    ),
    params(("request" = EnqueueVideoStyleTransferRequest, description = "Payload for request"))
)]
pub async fn enqueue_video_style_transfer_handler(
    http_request: HttpRequest,
    request: web::Json<EnqueueVideoStyleTransferRequest>,
    server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EnqueueVideoStyleTransferError>
{
    let mut mysql_connection = server_state.mysql_pool
        .acquire()
        .await
        .map_err(|err| {
            warn!("MySql pool error: {:?}", err);
            EnqueueVideoStyleTransferError::ServerError
        })?;

    let maybe_avt_token = server_state.avt_cookie_manager
        .get_avt_token_from_request(&http_request);

    // ==================== USER SESSION ==================== //

    let maybe_user_session = server_state
        .session_checker
        .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
        .await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            EnqueueVideoStyleTransferError::ServerError
        })?;

    let maybe_user_token = maybe_user_session
        .as_ref()
        .map(|session| session.user_token_typed.clone());

    // ==================== FEATURE FLAG CHECK ==================== //

    if !allowed_video_style_transfer_access(maybe_user_session.as_ref(), &server_state.flags) {
        warn!("Video style transfer access is not permitted for user");
        return Err(EnqueueVideoStyleTransferError::NotAuthorized);
    }

    // ==================== PAID PLAN + PRIORITY ==================== //

    // TODO: Plan should handle "first anonymous use" and "investor" cases.
    let plan = get_correct_plan_for_session(
        server_state.server_environment,
        maybe_user_session.as_ref());

    // TODO: Separate priority for animation.
    let priority_level = plan.web_vc_base_priority_level();

    // ==================== DEBUG MODE + ROUTING TAG ==================== //

    let is_debug_request =
        get_request_header_optional(&http_request, DEBUG_HEADER_NAME)
            .is_some();

    let maybe_routing_tag=
        get_request_header_optional(&http_request, ROUTING_TAG_HEADER_NAME)
            .map(|routing_tag| routing_tag.trim().to_string());

    // ==================== RATE LIMIT ==================== //

    let rate_limiter = match maybe_user_session {
        None => &server_state.redis_rate_limiters.logged_out,
        Some(ref user) => {
            if user.role.is_banned {
                return Err(EnqueueVideoStyleTransferError::NotAuthorized);
            }
            &server_state.redis_rate_limiters.logged_in
        },
    };

    if let Err(_err) = rate_limiter.rate_limit_request(&http_request) {
        return Err(EnqueueVideoStyleTransferError::RateLimited);
    }

    // ==================== HANDLE IDEMPOTENCY ==================== //

    if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
        return Err(EnqueueVideoStyleTransferError::BadInput(reason));
    }

    insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
        .await
        .map_err(|err| {
            error!("Error inserting idempotency token: {:?}", err);
            EnqueueVideoStyleTransferError::BadInput("invalid idempotency token".to_string())
        })?;

    // ==================== LOOK UP MODEL INFO ==================== //

    // TODO(bt): CHECK DATABASE FOR TOKENS!

    let ip_address = get_request_ip(&http_request);

    let maybe_user_preferred_visibility : Option<Visibility> = maybe_user_session
        .as_ref()
        .map(|user_session: &UserSessionExtended| user_session.preferences.preferred_tts_result_visibility); // TODO: New setting for web-vc

    let set_visibility = request.creator_set_visibility
        .or(maybe_user_preferred_visibility)
        .unwrap_or(Visibility::Public);


    let mut trim_start_millis = request.trim_start_millis.unwrap_or(0);
    let mut trim_end_millis = request.trim_end_millis.unwrap_or(DEFAULT_TRIM_MILLISECONDS_END);

    let has_paid_plan = plan.plan_slug() == "fakeyou_contributor" || plan.plan_category() == PlanCategory::Paid;

    // block trim too much
    if has_paid_plan {
        if trim_end_millis - trim_start_millis > MAXIMUM_DURATION_MILLIS {
            trim_start_millis = 0;
            trim_end_millis = MAXIMUM_DURATION_MILLIS;
        }
    } else {
        if trim_end_millis - trim_start_millis > DEFAULT_TRIM_MILLISECONDS_END {
            trim_start_millis = 0;
            trim_end_millis = DEFAULT_TRIM_MILLISECONDS_END;
        }
    }

    let maybe_strength = request.use_strength
        .map(|strength| {
            if strength < MINIMUM_STRENGTH || strength > MAXIMUM_STRENGTH {
                Err(EnqueueVideoStyleTransferError::BadInput("Strength must be between 0.0 and 1.0".to_string()))
            } else {
                Ok(strength)
            }
        })
        .transpose()?;

    // Must have paid plan to remove watermark
    let remove_watermark = request.remove_watermark
        .map(|remove_watermark| remove_watermark && has_paid_plan);

    let inference_args = WorkflowArgs {
        style_name: Some(request.style),
        creator_visibility: Some(set_visibility),
        trim_start_milliseconds: Some(trim_start_millis),
        trim_end_milliseconds: Some(trim_end_millis),
        positive_prompt: request.prompt.clone(),
        negative_prompt: request.negative_prompt.clone(),
        enable_lipsync: request.enable_lipsync,
        maybe_input_file: Some(request.input_file.clone()),
        remove_watermark,
        // The new, simplified enqueuing doesn't care about the following parameters:
        maybe_lora_model: None,
        maybe_json_modifications: None,
        maybe_workflow_config: None,
        maybe_output_path: None,
        maybe_google_drive_link: None,
        maybe_title: None,
        maybe_commit_hash:None,
        maybe_description:None,
        trim_start_seconds: None,
        trim_end_seconds: None,
        target_fps: None,
        rollout_python_workflow_args: get_request_header_optional(&http_request, "PYTHON-WORKFLOW-ARGS")
            .map(|value| str_to_bool(&value)),
        use_face_detailer: request.use_face_detailer,
        use_upscaler: request.use_upscaler,
        strength: maybe_strength,
    };

    info!("Creating ComfyUI job record...");

    let query_result = insert_generic_inference_job(InsertGenericInferenceArgs {
        uuid_idempotency_token: &request.uuid_idempotency_token,
        job_type: InferenceJobType::ComfyUi,
        inference_category: InferenceCategory::Workflow,
        maybe_model_type: Some(InferenceModelType::ComfyUi), // NB: Model is static during inference
        maybe_model_token: None, // NB: Model is static during inference
        maybe_input_source_token: None, // TODO: Introduce a second foreign key ?
        maybe_input_source_token_type: None, // TODO: Introduce a second foreign key ?
        maybe_download_url: None,
        maybe_cover_image_media_file_token: None,
        maybe_raw_inference_text: None, // No text
        maybe_max_duration_seconds: None,
        maybe_inference_args: Some(GenericInferenceArgs {
            inference_category: Some(InferenceCategoryAbbreviated::Workflow),
            args: Some(PolymorphicInferenceArgs::Cu(inference_args)),
        }),
        maybe_creator_user_token: maybe_user_token.as_ref(),
        maybe_avt_token: maybe_avt_token.as_ref(),
        creator_ip_address: &ip_address,
        creator_set_visibility:  set_visibility,
        priority_level,
        requires_keepalive: plan.workflow_requires_frontend_keepalive(),
        is_debug_request,
        maybe_routing_tag: maybe_routing_tag.as_deref(),
        mysql_pool: &server_state.mysql_pool,
    }).await;

    let job_token = match query_result {
        Ok((job_token, _id)) => job_token,
        Err(err) => {
            warn!("New generic inference job creation DB error: {:?}", err);
            return Err(EnqueueVideoStyleTransferError::ServerError);
        }
    };

    let response: EnqueueVideoStyleTransferSuccessResponse = EnqueueVideoStyleTransferSuccessResponse {
        success: true,
        inference_job_token: job_token,
    };

    let body = serde_json::to_string(&response)
        .map_err(|_e| EnqueueVideoStyleTransferError::ServerError)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}
