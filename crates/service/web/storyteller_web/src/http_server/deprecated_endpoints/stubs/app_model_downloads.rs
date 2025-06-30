use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;

use crate::state::server_state::ServerState;

// =============== Success Response ===============

#[derive(Serialize)]
pub struct AppModelDownloadsItem {
    // Name of the model
    pub title: String,

    // Where the file can be downloaded.
    pub download_url: String,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    // Semi-semver. "1.0", "1.5", etc.
    // pub version_string: String,

    // Monotonic version number.
    // pub version: u64,
}

#[derive(Serialize)]
pub struct AppModelDownloadsResponse {
    pub success: bool,

    // News items will be sorted in reverse chronological order.
    pub models: Vec<AppModelDownloadsItem>,
}


// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum AppModelDownloadsError {
    ServerError,
}

impl ResponseError for AppModelDownloadsError {
    fn status_code(&self) -> StatusCode {
        match *self {
            AppModelDownloadsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for AppModelDownloadsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

// =============== Handler ===============

pub async fn get_app_model_downloads_handler(
    http_request: HttpRequest,
    server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, AppModelDownloadsError>
{
    // TODO: Real news items.

    let mut models= Vec::new();

    models.push(AppModelDownloadsItem {
        title: "Mario".to_string(),
        download_url: "https://fakeyou.com".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    });

    models.push(AppModelDownloadsItem {
        title: "President Biden".to_string(),
        download_url: "https://storyteller.io".to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    });

    let response = AppModelDownloadsResponse {
        success: true,
        models,
    };

    let body = serde_json::to_string(&response)
        .map_err(|e| AppModelDownloadsError::ServerError)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}
