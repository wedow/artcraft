// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpResponse, HttpRequest};
use crate::utils::session_checker::SessionChecker;
use http_server_common::response::response_error_helpers::to_simple_json_error;
use log::warn;
use sqlx::MySqlPool;
use std::fmt;

#[derive(Serialize, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum FakeYouPlan {
  Free,
  Basic,
  Standard,
  Pro,
}

#[derive(Serialize, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum StorytellerStreamPlan {
  Free,
  Basic,
  Standard,
  Pro,
}

#[derive(Serialize)]
pub struct UserInfo {
  pub user_token: String,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,

  // Premium plans:
  pub fakeyou_plan: FakeYouPlan,
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

#[derive(Serialize)]
pub struct SessionInfoSuccessResponse {
  pub success: bool,
  pub logged_in: bool,
  pub user: Option<UserInfo>,
}

#[derive(Debug)]
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

pub async fn session_info_handler(
  http_request: HttpRequest,
  mysql_pool: web::Data<MySqlPool>,
  session_checker: web::Data<SessionChecker>,
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
      if !session_data.is_banned {
        // NB: Banned users can't be logged in
        logged_in = true;
        user_info = Some(UserInfo {
          user_token: session_data.user_token.clone(),
          username: session_data.username.to_string(),
          display_name: session_data.display_name.to_string(),
          email_gravatar_hash: session_data.email_gravatar_hash.to_string(),

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

  let response = SessionInfoSuccessResponse {
    success: true,
    logged_in,
    user: user_info,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| SessionInfoError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
