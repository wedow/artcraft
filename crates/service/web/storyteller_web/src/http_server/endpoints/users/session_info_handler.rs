// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::collections::BTreeSet;
use std::fmt;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use sqlx::MySqlPool;
use utoipa::ToSchema;

use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use http_server_common::response::response_error_helpers::to_simple_json_error;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::cookies::anonymous_visitor_tracking::avt_cookie_manager::AvtCookieManager;
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::http_server::session::session_checker::SessionChecker;

#[derive(Serialize, Copy, Clone, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum FakeYouPlan {
  Free,
  Basic,
  Standard,
  Pro,
}

#[derive(Serialize, Copy, Clone, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum StorytellerStreamPlan {
  Free,
  Basic,
  Standard,
  Pro,
}

#[derive(Serialize, ToSchema)]
pub struct SessionUserInfo {
  pub core_info: UserDetailsLight,

  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,

  // TODO(bt,2024-03-30): Remove legacy feature flag
  #[deprecated(note = "DO NOT USE. Use `maybe_feature_flags` instead! The flag you're looking for is `studio`.")]
  pub can_access_studio: bool,

  /// Collection of feature / rollout flags
  /// This is the proper place to detect if a user has access to some rollout (non-paywall) feature.
  /// NB: The BTreeSet maintains order so React doesn't introduce re-render state bugs when order changes
  pub maybe_feature_flags: BTreeSet<UserFeatureFlag>,

  // Premium plans:
  #[deprecated(note = "DO NOT USE. This was never used and is 100% meaningless.")]
  pub fakeyou_plan: FakeYouPlan,

  #[deprecated(note = "DO NOT USE. This was never used and is 100% meaningless.")]
  pub storyteller_stream_plan: StorytellerStreamPlan,

  // Usage permissions:
  pub can_use_tts: bool,
  pub can_use_w2l: bool,
  pub can_delete_own_tts_results: bool,
  pub can_delete_own_w2l_results: bool,
  pub can_delete_own_account: bool,

  // Contribution permissions:
  pub can_upload_tts_models: bool,
  pub can_upload_w2l_templates: bool,
  pub can_delete_own_tts_models: bool,
  pub can_delete_own_w2l_templates: bool,

  // Moderation permissions:
  pub can_approve_w2l_templates: bool,
  pub can_edit_other_users_profiles: bool,
  pub can_edit_other_users_tts_models: bool,
  pub can_edit_other_users_w2l_templates: bool,
  pub can_delete_other_users_tts_models: bool,
  pub can_delete_other_users_tts_results: bool,
  pub can_delete_other_users_w2l_templates: bool,
  pub can_delete_other_users_w2l_results: bool,
  pub can_ban_users: bool,
  pub can_delete_users: bool,
}

#[derive(Serialize, ToSchema)]
pub struct SessionInfoSuccessResponse {
  pub success: bool,
  pub logged_in: bool,
  pub user: Option<SessionUserInfo>,
}

#[derive(Debug, ToSchema)]
pub enum SessionInfoError {
  ServerError,
}

impl ResponseError for SessionInfoError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SessionInfoError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      SessionInfoError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for SessionInfoError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  get,
  tag = "Users",
  path = "/v1/session",
  responses(
    (status = 200, description = "Get profile", body = SessionInfoSuccessResponse),
    (status = 500, description = "Server error", body = SessionInfoError),
  ),
)]
pub async fn session_info_handler(
  http_request: HttpRequest,
  mysql_pool: web::Data<MySqlPool>,
  session_checker: web::Data<SessionChecker>,
  avt_manager: web::Data<AvtCookieManager>,
) -> Result<HttpResponse, SessionInfoError>
{
  let mut mysql_connection = mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        SessionInfoError::ServerError
      })?;

  let maybe_user_session = session_checker
    .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      SessionInfoError::ServerError
    })?;

  let mut logged_in = false;
  let mut user_info = None;

  match maybe_user_session {
    None => {}
    Some(session_data) => {
      let feature_flags =
          UserSessionFeatureFlags::new(session_data.maybe_feature_flags.as_deref());

      if !session_data.is_banned {
        // NB: Banned users can't be logged in
        logged_in = true;
        user_info = Some(SessionUserInfo {
          core_info: UserDetailsLight::from_db_fields(
            &session_data.user_token,
            &session_data.username,
            &session_data.display_name,
            &session_data.email_gravatar_hash,
          ),
          user_token: session_data.user_token,
          username: session_data.username.to_string(),
          display_name: session_data.display_name.to_string(),
          email_gravatar_hash: session_data.email_gravatar_hash.to_string(),

          // Rollout / feature flags:
          can_access_studio: feature_flags.has_flag(UserFeatureFlag::Studio),
          maybe_feature_flags: feature_flags.clone_flags(),

          // Premium plans:
          fakeyou_plan: FakeYouPlan::Free,
          storyteller_stream_plan: StorytellerStreamPlan::Free,

          // Usage permissions:
          can_use_tts: session_data.can_use_tts,
          can_use_w2l: session_data.can_use_w2l,
          can_delete_own_tts_results: session_data.can_delete_own_tts_results,
          can_delete_own_w2l_results: session_data.can_delete_own_w2l_results,
          can_delete_own_account: session_data.can_delete_own_account,

          // Contribution permissions:
          can_upload_tts_models: session_data.can_upload_tts_models,
          can_upload_w2l_templates: session_data.can_upload_w2l_templates,
          can_delete_own_tts_models: session_data.can_delete_own_tts_models,
          can_delete_own_w2l_templates: session_data.can_delete_own_w2l_templates,

          // Moderation permissions:
          can_approve_w2l_templates: session_data.can_approve_w2l_templates,
          can_edit_other_users_profiles: session_data.can_edit_other_users_profiles,
          can_edit_other_users_tts_models: session_data.can_edit_other_users_tts_models,
          can_edit_other_users_w2l_templates: session_data.can_edit_other_users_w2l_templates,
          can_delete_other_users_tts_models: session_data.can_delete_other_users_tts_models,
          can_delete_other_users_tts_results: session_data.can_delete_other_users_tts_results,
          can_delete_other_users_w2l_templates: session_data.can_delete_other_users_w2l_templates,
          can_delete_other_users_w2l_results: session_data.can_delete_other_users_w2l_results,
          can_ban_users: session_data.can_ban_users,
          can_delete_users: session_data.can_delete_users,
        });
      }
    }
  }

  let maybe_avt_cookie = match avt_manager.decode_cookie_payload_from_request(&http_request) {
    Ok(Some(_avt_cookie)) => None,
    _ => {
      let cookie = avt_manager.make_new_cookie()
          .map_err(|e| {
            warn!("avt cookie creation error: {:?}", e);
            SessionInfoError::ServerError
          })?;
      Some(cookie)
    }
  };

  let response = SessionInfoSuccessResponse {
    success: true,
    logged_in,
    user: user_info,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| SessionInfoError::ServerError)?;

  let mut response_builder = HttpResponse::Ok();

  if let Some(cookie) = maybe_avt_cookie {
    response_builder.cookie(cookie);
  }

  Ok(response_builder
    .content_type("application/json")
    .body(body))
}
