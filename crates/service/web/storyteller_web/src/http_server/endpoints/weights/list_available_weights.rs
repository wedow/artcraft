use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use chrono::{DateTime, Utc};
use log::{info, warn};
use rand::Rng;
use utoipa::ToSchema;

use enums::by_table::model_weights::{
    weights_category::WeightsCategory,
    weights_types::WeightsType,
};
use enums::common::visibility::Visibility;
use mysql_queries::queries::model_weights::list::list_weights_query_builder::ListWeightsQueryBuilder;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::server_state::ServerState;

#[derive(Deserialize,ToSchema)]
pub struct ListAvailableWeightsQuery {
    pub sort_ascending: Option<bool>,
    pub page_size: u16,
    pub page_index : u16,
    pub username: Option<String>,
    pub weights_type: Option<String>,
    pub weights_category: Option<String>,
}

#[derive(Serialize,ToSchema)]
pub struct ListAvailableWeightsSuccessResponse {
    pub success: bool,
    pub weights: Vec<ModelWeightForList>,
    pub page_size: u16,
    pub page_index : u16,
    pub cursor_next: Option<String>,
    pub cursor_previous: Option<String>,
}

#[derive(Serialize,ToSchema)]
pub struct ModelWeightForList {
    pub weight_token: ModelWeightToken,

    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,

    pub title: String,

    pub maybe_thumbnail_token: Option<String>,

    pub description_markdown: String,
    pub description_rendered_html: String,

    pub creator_user_token: UserToken,
    pub creator_set_visibility: Visibility,

    pub file_size_bytes: i32,
    pub file_checksum_sha2: String,

    pub cached_user_ratings_total_count: u32,
    pub cached_user_ratings_positive_count: u32,
    pub cached_user_ratings_negative_count: u32,
    pub maybe_cached_user_ratings_ratio: Option<f32>,

    pub version: i32,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_email_gravatar_hash: String,

    // additional fields to be added when tables are around
    pub likes: u32,
    pub bookmarks: bool,

}

#[derive(Debug,ToSchema)]
pub enum ListWeightError {
    NotAuthorized,
    ServerError,
}

impl std::fmt::Display for ListWeightError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl ResponseError for ListWeightError {
    fn status_code(&self) -> StatusCode {
        match *self {
            ListWeightError::NotAuthorized => StatusCode::UNAUTHORIZED,
            ListWeightError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

#[utoipa::path(
    get,
    path = "/v1/weights/list",
    responses(
        (status = 200, description = "List Weights", body = ListAvailableWeightsSuccessResponse),
        (status = 401, description = "Not authorized", body = ListWeightError),
        (status = 500, description = "Server error", body = ListWeightError),
    ),
    params(
        ("request" = ListAvailableWeightsQuery, description = "Payload for Request"),
    )
)]
pub async fn list_available_weights_handler(
    http_request: HttpRequest,
    query: web::Query<ListAvailableWeightsQuery>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, impl ResponseError> {
    let maybe_user_session = server_state.session_checker
        .maybe_get_user_session(&http_request, &server_state.mysql_pool).await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            ListWeightError::ServerError
        })?;

    let mut is_mod = false;
    let user_session = match maybe_user_session {
        Some(session) => {
            is_mod = session.can_ban_users;
            session
        }
        None => {
            info!("not logged in");
            return Err(ListWeightError::NotAuthorized);
        }
    };

    let limit = query.page_size;

    let sort_ascending = query.sort_ascending.unwrap_or(false);

    let include_user_hidden = is_mod;

    let mut weights_category: Option<WeightsCategory> = None;
    let mut weights_type: Option<WeightsType> = None;

    if let Some(weights_category_string) = query.weights_category.as_ref() {
        let result = WeightsCategory::from_str(&weights_category_string);
        match result {
            Ok(category) => { 
                weights_category = Some(category) 
            },
            Err(e) => {
                warn!("invalid weights_category: {:?}", e);
                weights_category = None
            }
        }
    }

    if let Some(weights_type_string) = query.weights_type.as_ref() {
        let result = WeightsType::from_str(&weights_type_string);
        match result {
            Ok(wtype) => { 
                weights_type = Some(wtype) 
            },
            Err(e) => {
                warn!("invalid weights_type: {:?}", e);
                weights_type = None
            }
        }
    }

    let mut query_builder = ListWeightsQueryBuilder::new()
        .sort_ascending(sort_ascending)
        .weights_category(weights_category)
        .weights_type(weights_type)
        .scope_creator_username(None)
        .include_user_hidden(include_user_hidden)
        .include_user_deleted_results(is_mod)
        .include_mod_deleted_results(is_mod)
        .limit(limit)
        .offset(Some((query.page_index as u64) * (query.page_size as u64)));

    let query_results = query_builder.perform_query_for_page(&server_state.mysql_pool).await;

    let weights_page = match query_results {
        Ok(results) => results,
        Err(e) => {
            warn!("Query error: {:?}", e);
            return Err(ListWeightError::ServerError);
        }
    };

    let cursor_next = if let Some(id) = weights_page.last_id {
        let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
          .map_err(|e| {
            warn!("crypto error: {:?}", e);
            ListWeightError::ServerError
        })?;
        Some(cursor)
    } else {
        None
    };

    let cursor_previous = if let Some(id) = weights_page.first_id {
        let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
          .map_err(|e| {
            warn!("crypto error: {:?}", e);
            ListWeightError::ServerError
        })?;
        Some(cursor)
    } else {
        None
    };

    let mut rng = rand::thread_rng();
    let random_float = rng.gen_range(0.0..1.0);
    let random_bool = random_float >= 0.5;

    // generate parse a response
    let response = ListAvailableWeightsSuccessResponse {
        success: true,
        weights: weights_page.weights.into_iter()
            .map(|weights| ModelWeightForList {
                weight_token: weights.token,
                title: weights.title,
                weights_type: weights.weights_type,
                weights_category: weights.weights_category,

                maybe_thumbnail_token:weights.maybe_thumbnail_token,
                description_markdown: weights.description_markdown,
                description_rendered_html: weights.description_rendered_html,

                creator_user_token: weights.creator_user_token,
                creator_set_visibility: weights.creator_set_visibility,

                file_size_bytes:weights.file_size_bytes,
                file_checksum_sha2: weights.file_checksum_sha2,

                cached_user_ratings_total_count: weights.cached_user_ratings_total_count,
                cached_user_ratings_positive_count: weights.cached_user_ratings_positive_count,
                cached_user_ratings_negative_count: weights.cached_user_ratings_negative_count,
                maybe_cached_user_ratings_ratio: weights.maybe_cached_user_ratings_ratio,

                version: weights.version,

                created_at: weights.created_at,
                updated_at: weights.updated_at,

                creator_username: weights.creator_username,
                creator_display_name: weights.creator_display_name,
                creator_email_gravatar_hash: weights.creator_email_gravatar_hash,

                // TODO: FIX THIS when we align again.
                bookmarks: random_bool,
                likes: rng.gen_range(0..1000),
            }).collect::<Vec<_>>(),
        cursor_next,
        cursor_previous,
        page_index: query.page_index,
        page_size: query.page_size
    };

    let body = serde_json::to_string(&response)
      .map_err(|e| ListWeightError::ServerError)?;

    Ok(HttpResponse::Ok().content_type("application/json").body(body))
}
