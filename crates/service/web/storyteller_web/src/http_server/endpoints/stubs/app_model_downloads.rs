use actix_http::Error;
use actix_web::http::header;
use actix_web::HttpResponseBuilder;
use actix_web::cookie::Cookie;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Path, Json};
use actix_web::{Responder, web, HttpResponse, error, HttpRequest};
use chrono::{DateTime, Utc, NaiveDateTime};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::server_state::ServerState;
use database_queries::complex_models::event_responses::EventResponse;
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
