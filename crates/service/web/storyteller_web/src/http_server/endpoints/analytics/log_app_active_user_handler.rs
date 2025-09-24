use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use enums::common::payments_namespace::PaymentsNamespace;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::analytics_active_users::upsert_analytics_app_active_user::UpsertAnalyticsAppActiveUser;
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct LogAppActiveUserRequest {
  /// An override for the application version.
  maybe_app_version: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct LogAppActiveUserResponse {
  pub success: bool,
}

/// Log an active app user - user must be logged in.
#[utoipa::path(
  post,
  tag = "Analytics",
  path = "/v1/analytics/active_user",
  responses(
    (status = 200, description = "Success", body = LogAppActiveUserSuccessResponse),
  ),
  params(
    ("request" = LogAppActiveUserRequest, description = "Payload for Request"),
  )
)]
pub async fn log_browser_session_handler(
  http_request: HttpRequest,
  request: Json<LogAppActiveUserRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<LogAppActiveUserResponse>, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await?;

  let user_token = maybe_user_session
      .ok_or(CommonWebError::NotAuthorized)?
      .user_token;
  
  let ip_address = get_request_ip(&http_request);
  
  let app_version = request.maybe_app_version
      .as_deref()
      .unwrap_or("unknown");

  let upsert = UpsertAnalyticsAppActiveUser {
    namespace: PaymentsNamespace::Artcraft,
    user_token: &user_token,
    ip_address: &ip_address,
    app_version,
  };
  
  upsert.upsert_with_connection(&mut mysql_connection).await?;

  Ok(Json(LogAppActiveUserResponse {
    success: true,
  }))
}

