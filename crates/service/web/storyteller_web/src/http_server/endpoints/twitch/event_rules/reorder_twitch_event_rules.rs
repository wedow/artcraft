use actix_http::Error;
use actix_web::http::header;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use crate::http_server::endpoints::twitch::event_rules::validations::validate_event_match_predicate::validate_event_match_predicate;
use crate::http_server::endpoints::twitch::event_rules::validations::validate_event_response::validate_event_response;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use database_queries::complex_models::event_match_predicate::EventMatchPredicate;
use database_queries::complex_models::event_responses::EventResponse;
use database_queries::queries::twitch::twitch_event_rules::get_twitch_event_rule_for_user::get_twitch_event_rule_for_user;
use database_queries::queries::twitch::twitch_event_rules::list_twitch_event_rules_for_user::list_twitch_event_rules_for_user;
use database_queries::queries::twitch::twitch_event_rules::reorder_twitch_event_rules::reorder_twitch_event_rules;
use database_queries::queries::twitch::twitch_event_rules::update_twitch_event_rule_builder::UpdateTwitchEventRuleBuilder;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn, log, error};
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::collections::{HashSet, HashMap};
use std::fmt;
use std::sync::Arc;

// =============== Request ===============

#[derive(Deserialize)]
pub struct RuleTokenPositionPair {
  pub rule_token: String,
  pub position: u32,
}

#[derive(Deserialize)]
pub struct ReorderTwitchEventRulesRequest {
  pub rule_token_position_pairs: Vec<RuleTokenPositionPair>
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct ReorderTwitchEventRulesResponse {
  pub success: bool,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum ReorderTwitchEventRulesError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for ReorderTwitchEventRulesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ReorderTwitchEventRulesError::BadInput(_) => StatusCode::BAD_REQUEST,
      ReorderTwitchEventRulesError::NotFound => StatusCode::NOT_FOUND,
      ReorderTwitchEventRulesError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ReorderTwitchEventRulesError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ReorderTwitchEventRulesError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn reorder_twitch_event_rules_handler(
  http_request: HttpRequest,
  request: web::Json<ReorderTwitchEventRulesRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, ReorderTwitchEventRulesError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ReorderTwitchEventRulesError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(ReorderTwitchEventRulesError::NotAuthorized);
    }
  };

  if user_session.is_banned {
    warn!("banned users cannot edit");
    return Err(ReorderTwitchEventRulesError::NotAuthorized);
  }

  let rules = list_twitch_event_rules_for_user(
    &user_session.user_token,
    &server_state.mysql_pool)
      .await
      .map_err(|e| {
        error!("Error with query: {:?}", e);
        return ReorderTwitchEventRulesError::ServerError;
      })?;

  // Here we check that the input set is entirely valid.
  // The update query is pretty dangerous (though also uses input checks), so this
  // should doubly guarantee nothing bad slips through.
  // Also it serves as a permission check.

  let valid_rule_tokens = rules.iter()
      .map(|rule| rule.token.to_string())
      .collect::<HashSet<String>>();

  let check_tokens = request.rule_token_position_pairs.iter()
      .map(|pair| pair.rule_token.to_string())
      .collect::<Vec<String>>();

  for check_token in check_tokens.iter() {
    if !valid_rule_tokens.contains(check_token.as_str()) {
      return Err(ReorderTwitchEventRulesError::BadInput("invalid token supplied".to_string()));
    }
  }

  let rule_token_to_order_map = request.rule_token_position_pairs.iter()
      .map(|pair| (pair.rule_token.to_string(), pair.position))
      .collect::<HashMap<String, u32>>();

  let ip_address = get_request_ip(&http_request);

  reorder_twitch_event_rules(
    rule_token_to_order_map,
    &user_session.user_token,
    &ip_address,
    &server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("Error with query: {:?}", err);
        return ReorderTwitchEventRulesError::ServerError;
      })?;


  let response = ReorderTwitchEventRulesResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ReorderTwitchEventRulesError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
