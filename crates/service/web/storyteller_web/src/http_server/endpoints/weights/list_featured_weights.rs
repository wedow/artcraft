use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use chrono::{DateTime, Utc};
use log::{debug, error, warn};
use r2d2_redis::redis::Commands;
use utoipa::ToSchema;

use enums::by_table::model_weights::{
  weights_category::WeightsCategory,
  weights_types::WeightsType,
};
use mysql_queries::queries::model_weights::list::list_weights_by_tokens::list_weights_by_tokens;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct ListFeaturedWeightsSuccessResponse {
  pub success: bool,
  pub weights: Vec<ModelWeightForList>,
}

#[derive(Serialize, ToSchema)]
pub struct ModelWeightForList {
  pub weight_token: ModelWeightToken,

  pub weights_type: WeightsType,
  pub weights_category: WeightsCategory,

  pub title: String,

  pub maybe_thumbnail_token: Option<String>,

  pub creator: UserDetailsLight,

  pub cached_user_ratings_total_count: u32,
  pub cached_user_ratings_positive_count: u32,
  pub cached_user_ratings_negative_count: u32,
  pub maybe_cached_user_ratings_ratio: Option<f32>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// The key we store featured weights tokens under
const REDIS_KEY : &str = "featured_weights_list";

#[derive(Debug, ToSchema)]
pub enum ListFeaturedWeightsError {
  NotAuthorized,
  ServerError,
}

impl std::fmt::Display for ListFeaturedWeightsError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListFeaturedWeightsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListFeaturedWeightsError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListFeaturedWeightsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

#[utoipa::path(
  get,
  path = "/v1/weights/list_featured",
  responses(
    (status = 200, description = "List Weights", body = ListFeaturedWeightsSuccessResponse),
    (status = 401, description = "Not authorized", body = ListFeaturedWeightsError),
    (status = 500, description = "Server error", body = ListFeaturedWeightsError),
  ),
)]
pub async fn list_featured_weights_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, impl ResponseError> {

  let mut redis = server_state.redis_pool.get()
      .map_err(|err| {
        error!("Could not obtain redis: {err}");
        ListFeaturedWeightsError::ServerError
      })?;

  let token_list : Option<String> = redis.get(REDIS_KEY)
      .map_err(|err| {
        error!("Could not get redis result: {err}");
        ListFeaturedWeightsError::ServerError
      })?;

  let weight_tokens = token_list
      .unwrap_or_else(|| "".to_string())
      .split(",")
      .into_iter()
      .map(|item| item.trim())
      .filter(|item| !item.is_empty())
      .map(|item| ModelWeightToken::new_from_str(item))
      .collect::<Vec<ModelWeightToken>>();

  debug!("Weight tokens from Redis: {:?}", weight_tokens);

  let mut weights = Vec::new();

  if !weight_tokens.is_empty() {
    let query_results =
        list_weights_by_tokens(&server_state.mysql_pool, &weight_tokens, false).await;

    weights = match query_results {
      Ok(weights) => weights,
      Err(e) => {
        warn!("Query error: {:?}", e);
        return Err(ListFeaturedWeightsError::ServerError);
      }
    };
  }

  let response = ListFeaturedWeightsSuccessResponse {
    success: true,
    weights: weights.into_iter()
        .map(|w| ModelWeightForList {
          weight_token: w.token,
          title: w.title,
          weights_type: w.weights_type,
          weights_category: w.weights_category,
          maybe_thumbnail_token: w.maybe_thumbnail_token,
          creator: UserDetailsLight::from_db_fields(
            &w.creator_user_token,
            &w.creator_username,
            &w.creator_display_name,
            &w.creator_email_gravatar_hash
          ),
          cached_user_ratings_total_count: w.cached_user_ratings_total_count,
          cached_user_ratings_positive_count: w.cached_user_ratings_positive_count,
          cached_user_ratings_negative_count: w.cached_user_ratings_negative_count,
          maybe_cached_user_ratings_ratio: w.maybe_cached_user_ratings_ratio,
          created_at: w.created_at,
          updated_at: w.updated_at,
        }).collect::<Vec<_>>(),
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ListFeaturedWeightsError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
