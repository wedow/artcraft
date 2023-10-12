

use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;

use log::{info, warn};
use mysql_queries::queries::voice_designer::inventory::list_voices_query_builder::{ListVoicesQueryBuilder, ZsVoiceRecordForList};
use crate::server_state::ServerState;
use generic_query::PaginatedQueryBuilders;


#[derive(Deserialize)]
pub struct ListZsVoicesQuery {
  pub sort_ascending: Option<bool>,
  pub limit: Option<u16>,
  pub cursor: Option<String>,
  pub cursor_is_reversed: Option<bool>,
}

#[derive(Serialize)]
pub struct ListZsVoicesSuccessResponse {
  pub success: bool,
  pub voices: Vec<ZsVoiceRecordForList>,
  pub cursor_next: Option<String>,
  pub cursor_previous: Option<String>
}

#[derive(Debug)]
pub enum ListZsVoicesError {
  NotAuthorized,
  ServerError,
}

impl std::fmt::Display for ListZsVoicesError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl ResponseError for ListZsVoicesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListZsVoicesError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ListZsVoicesError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }
}

pub async fn list_available_voices(
    http_request: HttpRequest,
    query: web::Query<ListZsVoicesQuery>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ListZsVoicesError> {

      let maybe_user_session = server_state.session_checker.maybe_get_user_session(
          &http_request,
          &server_state.mysql_pool
      ).await.map_err(|e| {
        warn!("Session checker error: {:?}", e);
        ListZsVoicesError::ServerError
      })?;

      let mut is_mod = false;
      let user_session = match maybe_user_session {
          Some(session) => {
              is_mod = session.can_ban_users;
              session
          }
          None => {
            info!("not logged in");
            return Err(ListZsVoicesError::NotAuthorized);
          }
      };


      let limit = query.limit.unwrap_or(25);

      let sort_ascending = query.sort_ascending.unwrap_or(false);
      let cursor_is_reversed = query.cursor_is_reversed.unwrap_or(false);

      let cursor = if let Some(cursor) = query.cursor.as_deref() {
        let cursor = server_state.sort_key_crypto.decrypt_id(cursor)
            .map_err(|e| {
              warn!("crypto error: {:?}", e);
              ListZsVoicesError::ServerError
            })?;
        Some(cursor)
      } else {
        None
      };

    let include_user_hidden = is_mod;


    let mut query_builder = ListVoicesQueryBuilder::new()
        .sort_ascending(sort_ascending)
        .scope_creator_username(None)
        .include_user_hidden(include_user_hidden)
        .include_user_deleted_results(is_mod)
        .include_mod_deleted_results(is_mod)
        .limit(limit)
        .cursor_is_reversed(cursor_is_reversed)
        .offset(cursor);

    let query_results = query_builder.perform_query_for_page(&server_state.mysql_pool).await;


    let voices_page = match query_results {
        Ok(results) => results,
        Err(e) => {
            warn!("Query error: {:?}", e);
            return Err(ListZsVoicesError::ServerError);
        }
    };

    let cursor_next = if let Some(id) = voices_page.last_id {
        let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
            .map_err(|e| {
                warn!("crypto error: {:?}", e);
                ListZsVoicesError::ServerError
            })?;
        Some(cursor)
    } else {
        None
    };

    let cursor_previous = if let Some(id) = voices_page.first_id {
        let cursor = server_state.sort_key_crypto.encrypt_id(id as u64)
            .map_err(|e| {
                warn!("crypto error: {:?}", e);
                ListZsVoicesError::ServerError
            })?;
        Some(cursor)
    } else {
        None
    };

    let response = ListZsVoicesSuccessResponse {
        success: true,
        voices: voices_page.voices,
        cursor_next,
        cursor_previous,
    };

    let body = serde_json::to_string(&response)
        .map_err(|e| ListZsVoicesError::ServerError)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}



