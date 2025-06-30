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
pub struct AppNewsItem {
    pub title: String,

    pub full_text_markdown: String,
    pub full_text_html: String,

    // Depending on our GUI's ability to include rich text or not, we'll also include an optional
    // primary link that could be the target of a button.
    pub maybe_primary_link: Option<String>,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct AppNewsResponse {
    pub success: bool,

    // News items will be sorted in reverse chronological order.
    pub news_items: Vec<AppNewsItem>,
}


// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum AppNewsError {
    ServerError,
}

impl ResponseError for AppNewsError {
    fn status_code(&self) -> StatusCode {
        match *self {
            AppNewsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for AppNewsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

// =============== Handler ===============

pub async fn get_app_news_handler(
    http_request: HttpRequest,
    server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, AppNewsError>
{
    // TODO: Real news items.

    let mut news_items = Vec::new();

    news_items.push(AppNewsItem {
        title: "New voices coming soon!".to_string(),
        full_text_markdown: "We have a bunch of new voices coming soon, so stay tuned!".to_string(),
        full_text_html: "We have a bunch of new voices coming soon, so stay tuned!".to_string(),
        maybe_primary_link: Some("https://fakeyou.com".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    });

    news_items.push(AppNewsItem {
        title: "Thanks for downloading!".to_string(),
        full_text_markdown: "Thanks for downloading our app! We promise much more is on the way!".to_string(),
        full_text_html: "Thanks for downloading our app! We promise much more is on the way!".to_string(),
        maybe_primary_link: Some("https://fakeyou.com".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    });


    let response = AppNewsResponse {
        success: true,
        news_items,
    };

    let body = serde_json::to_string(&response)
        .map_err(|e| AppNewsError::ServerError)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}
