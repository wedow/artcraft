use actix_http::Error;
use actix_web::http::header;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use database_queries::column_types::twitch_event_category::TwitchEventCategory;
use database_queries::complex_models::event_match_predicate::EventMatchPredicate;
use database_queries::complex_models::event_responses::EventResponse;
use database_queries::queries::twitch::twitch_event_rules::insert_twitch_event_rule_builder::InsertTwitchEventRuleBuilder;
use database_queries::tokens::Tokens;
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
pub struct CreateTwitchEventRuleRequest {
  pub idempotency_token: String,
  pub event_category: TwitchEventCategory,
  pub event_match_predicate: Option<EventMatchPredicate>,
  pub event_response: Option<EventResponse>,
  pub user_specified_rule_order: u32,
  pub rule_is_disabled: bool,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct CreateTwitchEventRuleResponse {
  pub success: bool,
  pub twitch_event_rule_token: String,
}

// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum CreateTwitchEventRuleError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for CreateTwitchEventRuleError {
  fn status_code(&self) -> StatusCode {
    match *self {
      CreateTwitchEventRuleError::BadInput(_) => StatusCode::BAD_REQUEST,
      CreateTwitchEventRuleError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CreateTwitchEventRuleError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for CreateTwitchEventRuleError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn create_twitch_event_rule_handler(
  http_request: HttpRequest,
  request: web::Json<CreateTwitchEventRuleRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CreateTwitchEventRuleError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CreateTwitchEventRuleError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CreateTwitchEventRuleError::NotAuthorized);
    }
  };

  if user_session.is_banned {
    warn!("banned users cannot use");
    return Err(CreateTwitchEventRuleError::NotAuthorized);
  }

  let creator_ip_address = get_request_ip(&http_request);

  let event_match_predicate = request.event_match_predicate
      .clone()
      .unwrap_or(EventMatchPredicate::NotSet {});

  let mut event_match_predicate = serde_json::to_string(&event_match_predicate)
      .map_err(|e| {
        return CreateTwitchEventRuleError::BadInput(
          "improper EventMatchPredicate".to_string());
      })?;

  let event_response = request.event_response
      .clone()
      .unwrap_or(EventResponse::NotSet {});

  let mut event_response = serde_json::to_string(&event_response)
      .map_err(|e| {
        return CreateTwitchEventRuleError::BadInput(
          "improper EventResponse".to_string());
      })?;

  let insert_builder = InsertTwitchEventRuleBuilder {
    uuid_idempotency_token: request.idempotency_token.clone(),
    user_token: user_session.user_token,
    event_category: request.event_category,
    event_match_predicate,
    event_response,
    user_specified_rule_order: request.user_specified_rule_order,
    rule_is_disabled: request.rule_is_disabled,
    ip_address_creation: creator_ip_address,
  };

  let twitch_event_rule_token = insert_builder.insert(&server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("creation error: {:?}", e);
        CreateTwitchEventRuleError::ServerError
      })?;

  let response = CreateTwitchEventRuleResponse {
    success: true,
    twitch_event_rule_token
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| CreateTwitchEventRuleError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
