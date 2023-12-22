use std::fmt;
use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Query};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use enums::common::visibility::Visibility;
use mysql_queries::queries::model_weights::list::list_weights_by_user::{list_weights_by_creator_username, ListWeightsForUserArgs};
use tokens::tokens::model_weights::ModelWeightToken;

use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::server_state::ServerState;

#[derive(Serialize, Clone,ToSchema)]
pub struct Weight {
  weight_token: ModelWeightToken,
  title: String,
  
  creator: UserDetailsLight,
  creator_set_visibility: Visibility,

  maybe_thumbnail_token: Option<String>,
    
  description_markdown: String,
  description_rendered_html: String,
  
  file_size_bytes: i32,
  file_checksum_sha2: String,
  cached_user_ratings_total_count: u32,
  cached_user_ratings_positive_count: u32,
  cached_user_ratings_negative_count: u32,
  maybe_cached_user_ratings_ratio: Option<f32>,
  cached_user_ratings_last_updated_at: DateTime<Utc>,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
}


#[derive(Serialize,ToSchema)]
pub struct ListWeightsByUserSuccessResponse {
  pub success: bool,
  pub results: Vec<Weight>,
  pub pagination: PaginationPage,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListWeightsForUserQueryParams {
  pub sort_ascending: Option<bool>,
  pub page_size: Option<usize>,
  pub page_index: Option<usize>,
}
#[derive(Deserialize,ToSchema)]
pub struct ListWeightsByUserPathInfo {
  username: String,
}

#[derive(Debug,ToSchema)]
pub enum ListWeightsByUserError {
  NotAuthorized,
  ServerError,
}

impl fmt::Display for ListWeightsByUserError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListWeightsByUserError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListWeightsByUserError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListWeightsByUserError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

#[utoipa::path(
  get,
  path = "/v1/weights/by_user/{username}",
  responses(
      (status = 200, description = "List Weights by user", body = ListWeightsByUserSuccessResponse),
      (status = 401, description = "Not authorized", body = ListWeightsByUserError),
      (status = 500, description = "Server error", body = ListWeightsByUserError),
  ),
  params(
      ("path" = ListWeightsByUserPathInfo, description = "Payload for Request"),
      ListWeightsForUserQueryParams
  )
)]
pub async fn list_weights_by_user_handler(
  http_request: HttpRequest,
  path: Path<ListWeightsByUserPathInfo>,
  query: Query<ListWeightsForUserQueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListWeightsByUserError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListWeightsByUserError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(ListWeightsByUserError::NotAuthorized);
    }
  };

  let username = path.username.as_ref();
  let creator_user_token = user_session.user_token.clone();
  let is_mod = user_session.can_ban_users;
  let limit = query.page_size.unwrap_or(25);
  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let page_size = query.page_size.unwrap_or_else(|| 25);
  let page_index = query.page_index.unwrap_or_else(|| 0);

  let query_results = list_weights_by_creator_username(
    ListWeightsForUserArgs{
        creator_username: username,
        page_size,
        page_index,
        can_see_deleted: is_mod,
        sort_ascending,
        mysql_pool: &server_state.mysql_pool,
    }
  ).await.map_err(|e| {
    warn!("Error querying for weights: {:?}", e);
    ListWeightsByUserError::ServerError
  });

  let results_page = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("Error querying for weights: {:?}", e);
      return Err(ListWeightsByUserError::ServerError);
    }
  };

  let weights:Vec<Weight> = results_page.records.into_iter().map(|weight| {
    Weight {
      weight_token: weight.token,
      title: weight.title,
      creator: UserDetailsLight::from_db_fields(
        &weight.creator_user_token,
        &weight.creator_username,
        &weight.creator_display_name,
        &weight.creator_email_gravatar_hash,
      ),
      maybe_thumbnail_token: weight.maybe_thumbnail_token,
      description_markdown: weight.description_markdown,
      description_rendered_html: weight.description_rendered_html,
      file_size_bytes: weight.file_size_bytes,
      file_checksum_sha2: weight.file_checksum_sha2,
      cached_user_ratings_total_count: weight.cached_user_ratings_total_count,
      cached_user_ratings_positive_count: weight.cached_user_ratings_positive_count,
      cached_user_ratings_negative_count: weight.cached_user_ratings_negative_count,
      maybe_cached_user_ratings_ratio: weight.maybe_cached_user_ratings_ratio,
      cached_user_ratings_last_updated_at: weight.cached_user_ratings_last_updated_at,
      creator_set_visibility: weight.creator_set_visibility,
      created_at: weight.created_at,
      updated_at: weight.updated_at,
    }
  }).collect();

  let final_weights:Vec<Weight>;

  // if it's not the user ... then only show public weights else show private and public
  if creator_user_token != user_session.user_token {
    final_weights = weights.into_iter().filter(|weight| {
      weight.creator_set_visibility == Visibility::Public
    }).collect();
 
  }  
  else {
    final_weights = weights;
  }


  let response: ListWeightsByUserSuccessResponse = ListWeightsByUserSuccessResponse {
    success: true,
    results: final_weights,
    pagination: PaginationPage {
      current: results_page.current_page,
      total_page_count: results_page.total_page_count,
    },
  };

  
  let body = serde_json::to_string(&response)
      .map_err(|e| ListWeightsByUserError::ServerError)?;
  
  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}