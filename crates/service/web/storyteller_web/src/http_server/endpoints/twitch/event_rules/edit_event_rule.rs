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
use database_queries::queries::twitch::twitch_event_rules::update_twitch_event_rule_builder::UpdateTwitchEventRuleBuilder;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{info, warn, log, error};
use sqlx::MySqlPool;
use sqlx::error::DatabaseError;
use sqlx::error::Error::Database;
use sqlx::mysql::MySqlDatabaseError;
use std::fmt;
use std::sync::Arc;

// =============== Request ===============

#[derive(Deserialize)]
pub struct EditTwitchEventRulePathInfo {
  token: String,
}

// These are not sparse updates!
#[derive(Deserialize)]
pub struct EditTwitchEventRuleRequest {
  pub event_match_predicate: Option<EventMatchPredicate>,
  pub event_response: Option<EventResponse>,
  pub rule_is_disabled: bool,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct EditTwitchEventRuleResponse {
  pub success: bool,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum EditTwitchEventRuleError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for EditTwitchEventRuleError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EditTwitchEventRuleError::BadInput(_) => StatusCode::BAD_REQUEST,
      EditTwitchEventRuleError::NotFound => StatusCode::NOT_FOUND,
      EditTwitchEventRuleError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EditTwitchEventRuleError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EditTwitchEventRuleError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn edit_twitch_event_rule_handler(
  http_request: HttpRequest,
  path: Path<EditTwitchEventRulePathInfo>,
  request: web::Json<EditTwitchEventRuleRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, EditTwitchEventRuleError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        EditTwitchEventRuleError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(EditTwitchEventRuleError::NotAuthorized);
    }
  };

  if user_session.is_banned {
    warn!("banned users cannot edit");
    return Err(EditTwitchEventRuleError::NotAuthorized);
  }

  let twitch_event_rule = get_twitch_event_rule_for_user(
    &path.token, &user_session.user_token, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        error!("Error with query: {:?}", e);
        return EditTwitchEventRuleError::ServerError;
      })?;

  if twitch_event_rule.is_none() {
    info!("event rule not found");
    return Err(EditTwitchEventRuleError::NotFound);
  }

  let creator_ip_address = get_request_ip(&http_request);

  let event_match_predicate = request.event_match_predicate
      .clone()
      .unwrap_or(EventMatchPredicate::NotSet {});

  validate_event_match_predicate(&event_match_predicate)
      .map_err(|reason|  EditTwitchEventRuleError::BadInput(reason))?;

  let mut event_match_predicate = serde_json::to_string(&event_match_predicate)
      .map_err(|e| {
        return EditTwitchEventRuleError::BadInput(
          "improper EventMatchPredicate".to_string());
      })?;

  let event_response = request.event_response
      .clone()
      .unwrap_or(EventResponse::NotSet {});

  validate_event_response(&event_response)
      .map_err(|reason|  EditTwitchEventRuleError::BadInput(reason))?;

  let mut event_response = serde_json::to_string(&event_response)
      .map_err(|e| {
        return EditTwitchEventRuleError::BadInput(
          "improper EventResponse".to_string());
      })?;

  let update_builder = UpdateTwitchEventRuleBuilder {
    token: path.token.clone(),
    event_match_predicate,
    event_response,
    rule_is_disabled: request.rule_is_disabled,
    ip_address_update: creator_ip_address,
  };

  let _r = update_builder.update(&server_state.mysql_pool)
      .await
      .map_err(|e| {
        error!("Error with query: {:?}", e);
        return EditTwitchEventRuleError::ServerError;
      });

  let response = EditTwitchEventRuleResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| EditTwitchEventRuleError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
