use actix_http::Error;
use actix_web::http::header;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use chrono::{DateTime, Utc};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use database_queries::column_types::twitch_event_category::TwitchEventCategory;
use database_queries::complex_models::event_match_predicate::EventMatchPredicate;
use database_queries::complex_models::event_responses::EventResponse;
use database_queries::queries::twitch::twitch_event_rules::list_twitch_event_rules_for_user::{TwitchEventRule, list_twitch_event_rules_for_user};
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use lexical_sort::natural_lexical_cmp;
use log::{info, warn, log, error};
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

// =============== Success Response ===============

#[derive(Debug, Serialize)]
pub struct HydratedTwitchEventRule {
  pub token: String,
  pub event_category: TwitchEventCategory,
  pub event_match_predicate: EventMatchPredicate,
  pub event_response: EventResponse,
  pub user_specified_rule_order: u32,
  pub rule_is_disabled: bool,
  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Serialize)]
pub struct ListTwitchEventRulesResponse {
  pub success: bool,
  pub twitch_event_rules: Vec<HydratedTwitchEventRule>,
}


// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum ListTwitchEventRulesError {
  NotAuthorized,
  ServerError,
}

impl ResponseError for ListTwitchEventRulesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListTwitchEventRulesError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListTwitchEventRulesError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListTwitchEventRulesError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn list_twitch_event_rules_for_user_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, ListTwitchEventRulesError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListTwitchEventRulesError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(ListTwitchEventRulesError::NotAuthorized);
    }
  };

  if user_session.is_banned {
    warn!("banned users cannot use");
    return Err(ListTwitchEventRulesError::NotAuthorized);
  }

  let twitch_event_rules = list_twitch_event_rules_for_user(
    &user_session.user_token, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("query error: {:?}", e);
        ListTwitchEventRulesError::ServerError
      })?;

  let twitch_event_rules = twitch_event_rules.into_iter()
      .map(|rule| {

        let event_match_predicate = serde_json::from_str(&rule.event_match_predicate)
            .unwrap_or_else(|e| {
              error!("Issue with deserializing: {}", e);
              EventMatchPredicate::NotSet {}
            });

        let event_response = serde_json::from_str(&rule.event_response)
            .unwrap_or_else(|e| {
              error!("Issue with deserializing: {}", e);
              EventResponse::NotSet {}
            });

        HydratedTwitchEventRule {
          token: rule.token,
          event_category: rule.event_category,
          event_match_predicate,
          event_response,
          user_specified_rule_order: rule.user_specified_rule_order,
          rule_is_disabled: rule.rule_is_disabled,
          created_at: rule.created_at,
          updated_at: rule.updated_at,
        }
      })
      .collect();

  let response = ListTwitchEventRulesResponse {
    success: true,
    twitch_event_rules,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListTwitchEventRulesError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
