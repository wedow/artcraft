// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpResponse, HttpRequest};
use chrono::{DateTime, Utc};
use crate::utils::session_checker::SessionChecker;
use database_queries::queries::users::user_badges::list_user_badges::UserBadgeForList;
use database_queries::queries::users::user_badges::list_user_badges::list_user_badges;
use database_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username_from_connection;
use enums::core::visibility::Visibility;
use http_server_common::request::get_request_header_optional::get_request_header_optional;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use http_server_common::util::timer::MultiBenchmarkingTimer;
use log::warn;
use sqlx::MySqlPool;
use std::fmt;
use tokens::users::user::UserToken;

// TODO: This is duplicated in query_user_profile
// TODO: This handler has embedded queries.

#[derive(Serialize)]
pub struct UserProfileRecordForResponse {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
  pub profile_markdown: String,
  pub profile_rendered_html: String,
  pub user_role_slug: String,
  pub disable_gravatar: bool,
  pub preferred_tts_result_visibility: Visibility,
  pub preferred_w2l_result_visibility: Visibility,
  pub discord_username: Option<String>,
  pub twitch_username: Option<String>,
  pub twitter_username: Option<String>,
  pub patreon_username: Option<String>,
  pub github_username: Option<String>,
  pub cashapp_username: Option<String>,
  pub website_url: Option<String>,
  pub badges: Vec<UserBadgeForList>,
  pub created_at: DateTime<Utc>,
  pub maybe_moderator_fields: Option<UserProfileModeratorFields>,
}

#[derive(Serialize)]
pub struct UserProfileModeratorFields {
  pub is_banned: bool,
  pub maybe_mod_comments: Option<String>,
  pub maybe_mod_user_token: Option<String>,
}

#[derive(Serialize)]
pub struct ProfileSuccessResponse {
  pub success: bool,
  pub user: Option<UserProfileRecordForResponse>,
}

#[derive(Debug, Serialize)]
pub enum ProfileError {
  ServerError,
  NotFound,
}

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetProfilePathInfo {
  username: String,
}

impl ResponseError for ProfileError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ProfileError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
      ProfileError::NotFound => StatusCode::NOT_FOUND,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ProfileError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_profile_handler(
  http_request: HttpRequest,
  path: Path<GetProfilePathInfo>,
  mysql_pool: web::Data<MySqlPool>,
  session_checker: web::Data<SessionChecker>,
) -> Result<HttpResponse, ProfileError>
{
  let mut benchmark = MultiBenchmarkingTimer::new_started();

  let pool_connection = mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        ProfileError::ServerError
      })?;

  let (pool_connection, maybe_user_session_fut) =
      benchmark.time_async_section_moving_args("session checker", pool_connection, |mut pc| async {
        let ret = session_checker
            .maybe_get_user_session_from_connection(&http_request, &mut pc)
            .await
            .map_err(|e| {
              warn!("Session checker error: {:?}", e);
              ProfileError::ServerError
            });
        (pc, ret)
        }
      ).await;

  let maybe_user_session = maybe_user_session_fut?;

  let mut is_mod = false;

  if let Some(user_session) = &maybe_user_session {
    is_mod = user_session.can_ban_users;
  }

  let (pool_connection, maybe_user_profile) =
      benchmark.time_async_section_moving_args("profile query", pool_connection, |mut pc| async {
        let ret = get_user_profile_by_username_from_connection(&path.username, &mut pc).await;
        (pc, ret)
      }).await;

  let user_profile = match maybe_user_profile {
    Ok(Some(user_profile)) => user_profile,
    Ok(None) => {
      warn!("Invalid user");
      return Err(ProfileError::NotFound);
    },
    Err(err) => {
      warn!("User profile query error: {:?}", err);
      return Err(ProfileError::ServerError);
    }
  };

  let is_banned = user_profile.maybe_moderator_fields
      .as_ref()
      .map(|mod_fields| mod_fields.is_banned)
      .unwrap_or(false);

  if is_banned && !is_mod {
    // Can't see banned users.
    return Err(ProfileError::NotFound);
  }

  let (_pool_connection, maybe_badges) =
      benchmark.time_async_section_moving_args("badges query", pool_connection, |mut pc| async {
        let ret = list_user_badges(&mut pc, &user_profile.user_token.0)
            .await;
        (pc, ret)
      }).await;

  let badges = maybe_badges
      .unwrap_or_else(|err| {
        warn!("Error querying badges: {:?}", err);
        return Vec::new(); // NB: Fine if this fails. Not sure why it would.
      });

  let mut profile_for_response = UserProfileRecordForResponse {
    user_token: user_profile.user_token,
    username: user_profile.username,
    display_name: user_profile.display_name,
    email_gravatar_hash: user_profile.email_gravatar_hash,
    profile_markdown: user_profile.profile_markdown,
    profile_rendered_html: user_profile.profile_rendered_html,
    user_role_slug: user_profile.user_role_slug,
    disable_gravatar: user_profile.disable_gravatar,
    preferred_tts_result_visibility: user_profile.preferred_tts_result_visibility,
    preferred_w2l_result_visibility: user_profile.preferred_w2l_result_visibility,
    discord_username: user_profile.discord_username,
    twitch_username: user_profile.twitch_username,
    twitter_username: user_profile.twitter_username,
    patreon_username: user_profile.patreon_username,
    github_username: user_profile.github_username,
    cashapp_username: user_profile.cashapp_username,
    website_url: user_profile.website_url,
    created_at: user_profile.created_at,
    maybe_moderator_fields: user_profile.maybe_moderator_fields.map(|mod_fields| {
      UserProfileModeratorFields {
        is_banned: mod_fields.is_banned,
        maybe_mod_comments: mod_fields.maybe_mod_comments,
        maybe_mod_user_token: mod_fields.maybe_mod_user_token,
      }
    }),
    badges,
  };

  if !is_mod {
    profile_for_response.maybe_moderator_fields = None;
  }

  benchmark.mark_end();

  let response = ProfileSuccessResponse {
    success: true,
    user: Some(profile_for_response),
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| ProfileError::ServerError)?;

  let mut http_response = HttpResponse::Ok();

  http_response.content_type("application/json");

  let has_debug_header = get_request_header_optional(&http_request, "debug-timing")
      .is_some();

  if has_debug_header {
    for header in benchmark.section_timings_as_headers() {
      http_response.insert_header(header);
    }
  }

  let http_response = http_response.body(body);

  Ok(http_response)
}
