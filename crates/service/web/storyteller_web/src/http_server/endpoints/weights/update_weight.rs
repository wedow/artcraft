use std::fmt;
use std::sync::Arc;

use actix_web::{ HttpRequest, HttpResponse, web };
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use log::{ error, warn };

use enums::common::visibility::Visibility;
use http_server_common::response::response_success_helpers::simple_json_success;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::model_weights::get_weight::get_weight_by_token;
use mysql_queries::queries::model_weights::edit::update_weight::{ update_weights, UpdateWeightArgs };
use tokens::tokens::model_weights::ModelWeightToken;

use crate::server_state::ServerState;
use utoipa::ToSchema;
/// TODO will eventually be polymorphic
#[derive(Deserialize, ToSchema)]
pub struct UpdateWeightRequest {
    pub title: Option<String>,
    pub thumbnail_token: Option<String>,
    pub description_markdown: Option<String>,
    pub description_rendered_html: Option<String>,
    pub weight_type: Option<String>,
    pub weight_category: Option<String>,
    pub visibility: Option<Visibility>,
}

#[derive(Serialize, ToSchema)]
pub struct UpdateWeightResponse {
    pub success: bool,
}

/// For the URL PathInfo
#[derive(Deserialize,ToSchema)]
pub struct UpdateWeightPathInfo {
    weight_token: String,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum UpdateWeightError {
    BadInput(String),
    NotFound,
    NotAuthorized,
    ServerError,
}

impl ResponseError for UpdateWeightError {
    fn status_code(&self) -> StatusCode {
        match *self {
            UpdateWeightError::BadInput(_) => StatusCode::BAD_REQUEST,
            UpdateWeightError::NotFound => StatusCode::NOT_FOUND,
            UpdateWeightError::NotAuthorized => StatusCode::UNAUTHORIZED,
            UpdateWeightError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for UpdateWeightError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

// =============== Handler ===============
#[utoipa::path(
    post,
    path = "/v1/weights/weight/{weight_token}",
    responses(
        (status = 200, description = "Success Update", body = SimpleGenericJsonSuccess),
        (status = 400, description = "Bad input", body = UpdateWeightError),
        (status = 401, description = "Not authorized", body = UpdateWeightError),
        (status = 500, description = "Server error", body = UpdateWeightError),
    ),
    params(
        ("request" = UpdateWeightRequest, description = "Payload for Request"),
        ("path" = UpdateWeightPathInfo, description = "Path for Request")
    )
  )]
pub async fn update_weight_handler(
    http_request: HttpRequest,
    path: Path<UpdateWeightPathInfo>,
    request: web::Json<UpdateWeightRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, UpdateWeightError> {
    let my_sql_pool = &server_state.mysql_pool;

    let maybe_user_session = server_state.session_checker
        .maybe_get_user_session(&http_request, &server_state.mysql_pool).await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            UpdateWeightError::ServerError
        })?;

    let user_session = match maybe_user_session {
        Some(session) => session,
        None => {
            warn!("not logged in");
            return Err(UpdateWeightError::NotAuthorized);
        }
    };

    let weight_token = path.weight_token.clone();

    // TODO wouldn't we want to instead use a function that will query the DB for the user and determine if they are a mod?
    let is_mod = user_session.can_ban_users;

    let weight_lookup_result = get_weight_by_token(
        &ModelWeightToken::new(weight_token.clone()),
        is_mod,
        &server_state.mysql_pool
    ).await;

    let weight = match weight_lookup_result {
        Ok(Some(weight)) => weight,
        Ok(None) => {
            warn!("Weight not found: {:?}", weight_token);
            return Err(UpdateWeightError::NotFound);
        }
        Err(err) => {
            warn!("Error looking up weight: {:?}", err);
            return Err(UpdateWeightError::ServerError);
        }
    };

    let is_creator = weight.creator_user_token.to_string() == user_session.user_token;

    if !is_creator && !is_mod {
        warn!("user is not allowed to edit this weight: {}", user_session.user_token);
        return Err(UpdateWeightError::NotAuthorized);
    }

    let query_result = update_weights(UpdateWeightArgs {
        weight_token: &ModelWeightToken::new(path.weight_token.clone()),
        mysql_pool: &server_state.mysql_pool,
        title: request.title.as_deref(),
        maybe_thumbnail_token: request.thumbnail_token.as_deref(),
        description_markdown: request.description_markdown.as_deref(),
        description_rendered_html: request.description_rendered_html.as_deref(),
        creator_set_visibility: request.visibility.as_ref(),
        weights_type: request.weight_type.as_deref().map(|s| s.to_string()),
        weights_category: request.weight_category.as_deref().map(|s| s.to_string()),
    }).await;

    match query_result {
        Ok(_) => {}
        Err(err) => {
            warn!("Update Weight DB error: {:?}", err);
            return Err(UpdateWeightError::ServerError);
        }
    }

    Ok(simple_json_success())
}
